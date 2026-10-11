"""Windows behavior, including real OS integration on the Windows CI runners.

Every test uses temporary data and mock credentials. Native scheduler tests own a
unique disabled/future task; they never need Oura, Telegram or an account login.
"""
import base64
import contextlib
import io
import json
import os
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import urllib.request
import uuid
from pathlib import Path
from unittest import mock

import oura_stress_telegram as ost

ROOT = Path(__file__).resolve().parent.parent
WINDOWS = os.name == "nt"
SID = "S-1-5-21-111-222-333-1001"


class WindowsDesignTests(unittest.TestCase):
    def test_local_account_alias_is_resolved_only_for_current_user(self):
        acl = "D:P(A;OICI;FA;;;LA)(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)"
        self.assertTrue(ost.private_windows_acl(acl, "S-1-5-21-111-222-333-500"))
        self.assertFalse(ost.private_windows_acl(acl, SID))

    def test_scheduler_omitted_defaults_match_explicit_defaults(self):
        xml = ost.windows_task_xml("pythonw.exe", Path("s.py"), Path("data"), 5, SID, "id")
        normalized = xml.replace("<RunLevel>LeastPrivilege</RunLevel>", "").replace(
            "<WakeToRun>false</WakeToRun>", "").replace("<Enabled>true</Enabled>", "")
        self.assertEqual(ost.windows_task_fields(xml), ost.windows_task_fields(normalized))

    def test_private_acl_allows_admins_but_rejects_broad_access(self):
        own = f"(A;OICI;FA;;;{SID})"
        self.assertTrue(ost.private_windows_acl("D:P" + own + "(A;OICI;FA;;;BA)", SID))
        self.assertTrue(ost.private_windows_acl("D:AI" + own + "(A;ID;FA;;;SY)", SID))
        for other in ("WD", "BU", "AU", "S-1-5-21-777-888-999-1001"):
            self.assertFalse(ost.private_windows_acl("D:P" + own + f"(A;;FR;;;{other})", SID))
        self.assertFalse(ost.private_windows_acl("D:", SID))
        self.assertFalse(ost.private_windows_acl(f"D:(A;;FR;;;{SID})", SID))

    def test_task_contains_only_a_repeating_least_privilege_action(self):
        script = Path("/a & b/O'Brien/alert.py")
        root = Path("/data 100%/café")
        xml = ost.windows_task_xml("pythonw.exe", script, root, 7, SID, "installation-id")
        fields = ost.windows_task_fields(xml)
        self.assertEqual(fields["Actions/Exec/Arguments"], subprocess.list2cmdline(
            [str(script), "--data-dir", str(root), "check", "--scheduled", "--run-id", "installation-id"]))
        self.assertEqual(fields["Principals/Principal/UserId"], SID)
        self.assertEqual(fields["Principals/Principal/LogonType"], "InteractiveToken")
        self.assertEqual(fields["Principals/Principal/RunLevel"], "LeastPrivilege")
        self.assertEqual(fields["Settings/MultipleInstancesPolicy"], "IgnoreNew")
        self.assertEqual(fields["Settings/ExecutionTimeLimit"], "PT10M")
        self.assertEqual(fields["Triggers/TimeTrigger/Repetition/Interval"], "PT7M")
        self.assertEqual(fields["trigger_count"], 1)
        self.assertEqual(fields["action_count"], 1)
        self.assertNotIn("LogonTrigger", xml)
        self.assertIn("&amp;", xml)
        self.assertNotIn("Password", xml)

    def test_task_rejects_environment_expansion_in_all_path_arguments(self):
        for exe, script, data in ((r"C:\%USERPROFILE%\pythonw.exe", "s.py", "data"),
                                  ("pythonw.exe", "%TEMP%/s.py", "data"),
                                  ("pythonw.exe", "s.py", "%CUSTOM%/data")):
            with self.assertRaisesRegex(ost.AppError, "percent"):
                ost.windows_task_xml(exe, Path(script), Path(data), 5, SID, "id")

    def test_xml_escapes_markup_and_rejects_invalid_intervals(self):
        xml = ost.windows_task_xml("pythonw.exe", Path("<script>&.py"), Path("<data>"), 5, SID, "id")
        self.assertIn("&lt;script&gt;&amp;", xml)
        self.assertIn("<script>&.py", ost.windows_task_fields(xml)["Actions/Exec/Arguments"])
        for interval in (0, 60):
            with self.assertRaises(ost.AppError):
                ost.windows_task_xml("pythonw.exe", Path("x"), Path("y"), interval, SID, "id")

    def test_windowless_context_generates_a_console_recovery_command(self):
        with mock.patch.object(ost, "is_windows", return_value=True), \
                mock.patch.object(ost.sys, "executable", str(Path("/runtime/pythonw.exe"))), \
                mock.patch.object(ost, "installed_script_path", return_value=Path("/missing/alert.py")):
            command = ost.command_for("connect-oura", ost.Paths(Path("/data O’Brien's")))
        self.assertIn("python.exe", command)
        self.assertNotIn("pythonw.exe", command)
        self.assertTrue(command.startswith("& "))
        self.assertIn("--data-dir", command)
        self.assertIn("O’’Brien''s", command)

    def test_store_runtime_rejected_before_setup_or_any_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp) / "never-created"
            with mock.patch.object(ost, "is_windows", return_value=True), \
                    mock.patch.object(sys, "base_prefix", r"C:\Program Files\WindowsApps\Python.Store"), \
                    mock.patch.dict(ost.COMMANDS, {"setup": mock.Mock()}), \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(ost.main(["--data-dir", str(data), "setup"]), 1)
                ost.COMMANDS["setup"].assert_not_called()
            self.assertFalse(data.exists())

    def test_bridge_is_hidden_utf8_json_and_never_shell_code(self):
        result = subprocess.CompletedProcess([], 0, '{"exists":false}', "")
        with mock.patch.object(ost, "windows_user_sid", return_value=SID), \
                mock.patch.object(ost, "windows_powershell", return_value="trusted-powershell.exe"), \
                mock.patch.object(subprocess, "CREATE_NO_WINDOW", 0x08000000, create=True), \
                mock.patch.object(subprocess, "run", return_value=result) as run:
            self.assertEqual(ost.windows_task("query", name="test O’Brien & café"), {"exists": False})
        args, kwargs = run.call_args
        self.assertEqual(args[0][0], "trusted-powershell.exe")
        self.assertEqual(base64.b64decode(args[0][-1]).decode("utf-16-le"), ost.WINDOWS_TASK_SCRIPT)
        self.assertEqual(json.loads(kwargs["input"])["name"], "test O’Brien & café")
        self.assertEqual(kwargs["encoding"], "utf-8")
        self.assertEqual(kwargs["creationflags"], 0x08000000)
        self.assertNotIn("shell", kwargs)

    def test_bridge_errors_are_not_reported_as_absent(self):
        with mock.patch.object(ost, "windows_user_sid", return_value=SID), \
                mock.patch.object(ost, "windows_powershell", return_value="powershell.exe"), \
                mock.patch.object(subprocess, "CREATE_NO_WINDOW", 0, create=True):
            for result in (subprocess.CompletedProcess([], 1, "", "Access denied"),
                           subprocess.CompletedProcess([], 0, "not json", ""),
                           subprocess.CompletedProcess([], 0, '{"exists":"false"}', "")):
                with mock.patch.object(subprocess, "run", return_value=result), \
                        self.assertRaises(ost.AppError):
                    ost.windows_task("query")

    def test_status_distinguishes_disabled_task(self):
        with mock.patch.object(ost.platform, "system", return_value="Windows"), \
                mock.patch.object(ost, "windows_task", return_value={"exists": True, "enabled": False}):
            self.assertIn("disabled", ost.schedule_description())
        with mock.patch.object(ost.platform, "system", return_value="Windows"), \
                mock.patch.object(ost, "windows_task", side_effect=ost.AppError("query failed")):
            with self.assertRaisesRegex(ost.AppError, "query failed"):
                ost.schedule_description()

    def test_scheduler_receipt_must_match_installation(self):
        receipt = {"invoked_at": time.time(), "finished_at": time.time(), "outcome": "ok", "run_id": "old"}
        with mock.patch.object(ost, "read_last_run", return_value=receipt), \
                mock.patch.object(ost.time, "sleep"):
            self.assertIsNone(ost.wait_for_scheduled_run(None, 0, timeout=.01, run_id="new"))
            receipt["run_id"] = "new"
            self.assertEqual(ost.wait_for_scheduled_run(None, 0, run_id="new"), "ok")

    def test_hidden_console_paste_handles_backspace_extended_keys_and_cancel(self):
        data = list("https://localhost/x\b?code=abc&state=s\r")
        msvcrt = mock.Mock(kbhit=lambda: bool(data), getwch=lambda: data.pop(0))
        with mock.patch.dict(sys.modules, {"msvcrt": msvcrt}):
            reader = ost.WindowsConsoleLine()
            self.assertEqual(reader.poll(), "https://localhost/?code=abc&state=s")
            data.extend(["\xe0", "K", "o", "k", "\r"])
            self.assertEqual(reader.poll(), "ok")
            data.extend(["\x03"])
            with self.assertRaises(KeyboardInterrupt):
                reader.poll()
            data.extend("leftover")
            reader.discard()
            self.assertEqual(data, [])

    def test_soft_timeout_and_cancel_restore_sigint(self):
        before = signal.getsignal(signal.SIGINT)
        with self.assertRaises(ost.RunTimeout):
            with ost.windows_time_limit(.03):
                while True:
                    pass
        self.assertEqual(signal.getsignal(signal.SIGINT), before)
        for _ in range(20):
            with ost.windows_time_limit(.05):
                pass
        time.sleep(.08)
        self.assertEqual(signal.getsignal(signal.SIGINT), before)
        with self.assertRaises(KeyboardInterrupt):
            with ost.windows_time_limit(10):
                ost._thread.interrupt_main()
        self.assertEqual(signal.getsignal(signal.SIGINT), before)

    def test_scheduled_errors_stay_in_log_with_missing_console_streams(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "data"
            with mock.patch.dict(ost.COMMANDS, {"check": mock.Mock(side_effect=ost.AppError("safe failure"))}), \
                    mock.patch.object(sys, "stdout", None), mock.patch.object(sys, "stderr", None):
                self.assertEqual(ost.main(["--data-dir", str(root), "check", "--scheduled"]), 1)
            self.assertIn("safe failure", (root / "check.log").read_text(encoding="utf-8"))

    def test_persistent_replace_error_closes_and_removes_temp(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            with mock.patch.object(ost, "replace_private_file", side_effect=PermissionError("busy")):
                with self.assertRaises(PermissionError):
                    ost.write_json_private(root / "tokens.json", {"value": "fake"})
            self.assertEqual(list(root.iterdir()), [])


@unittest.skipUnless(WINDOWS, "native Windows integration")
class NativeWindowsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "data & café O’Brien's 100%"
        self.paths = ost.Paths(self.root)

    def ps(self, code):
        code = ("[Console]::InputEncoding = [Text.UTF8Encoding]::new($false); "
                "[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); " + code)
        encoded = base64.b64encode(code.encode("utf-16-le")).decode("ascii")
        return subprocess.run([ost.windows_powershell(), "-NoProfile", "-NonInteractive",
                               "-EncodedCommand", encoded], capture_output=True, encoding="utf-8",
                              creationflags=subprocess.CREATE_NO_WINDOW, timeout=60)

    def test_minimal_environment_can_run_windows_powershell(self):
        result = subprocess.run([ost.windows_powershell(), "-NoProfile", "-NonInteractive",
                                 "-Command", "Write-Output 'ready'"],
                                env=ost.scheduled_environment(self.paths), capture_output=True,
                                encoding="utf-8", creationflags=subprocess.CREATE_NO_WINDOW, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "ready", result.stderr)

    def test_private_creation_and_unrelated_directory_are_safe(self):
        try:
            ost.write_json_private(self.paths.config, {"value": "fake"})
        except ost.AppError:
            # Safe diagnostic of this disposable CI folder, never saved keys.
            sid = ost.windows_user_sid()
            self.fail("Private-folder validation failed; account RID=" + sid.rsplit("-", 1)[-1]
                      + "; ACL=" + ost.windows_acl(self.root).replace(sid, "CURRENT_USER"))
        sid = ost.windows_user_sid()
        self.assertTrue(sid.startswith("S-1-"))
        self.assertTrue(ost.private_windows_acl(ost.windows_acl(self.root), sid))
        self.assertTrue(ost.private_windows_acl(ost.windows_acl(self.paths.config), sid))
        other = Path(self.tmp.name) / "shared"
        other.mkdir()
        (other / "unrelated.txt").write_text("keep")
        # A broad allow ACE makes this unsafe. Do not propagate a repair to children.
        subprocess.run(["icacls", str(other), "/grant", "*S-1-1-0:(OI)(CI)R"],
                       capture_output=True, check=True)
        before = ost.windows_acl(other / "unrelated.txt")
        with self.assertRaisesRegex(ost.AppError, "unrelated"):
            ost.ensure_private_dir(other)
        self.assertEqual(ost.windows_acl(other / "unrelated.txt"), before)

    def test_atomic_replace_retries_an_open_destination(self):
        ost.write_json_private(self.paths.tokens, {"generation": 1})
        held = open(self.paths.tokens, "rb")
        timer = threading.Timer(.2, held.close)
        timer.start()
        try:
            ost.write_json_private(self.paths.tokens, {"generation": 2})
        finally:
            timer.join()
            held.close()
        self.assertEqual(ost.read_json(self.paths.tokens)["generation"], 2)
        self.assertEqual(list(self.root.glob("*.tmp")), [])

    def test_recovery_command_round_trips_real_power_shell_paths(self):
        ost.write_json_private(self.paths.config, {})
        command = ost.command_for("status", self.paths, prefer_installed=False)
        # Avoid inheriting a console encoding into Python's redirected output.
        result = self.ps("$env:PYTHONIOENCODING='utf-8'; " + command + "; exit $LASTEXITCODE")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(str(self.root.resolve()), result.stdout)

    def test_pythonw_records_an_isolated_failed_check(self):
        exe = ost.windows_pythonw()
        result = subprocess.run([exe] + ost.windows_task_arguments(ROOT / ost.SCRIPT_NAME,
                                                                  self.root, "pythonw-test"),
                                env=ost.scheduled_environment(self.paths), timeout=30)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(ost.read_last_run(self.paths)["run_id"], "pythonw-test")
        self.assertIn("setup is not finished", (self.root / "check.log").read_text(encoding="utf-8"))

    def test_callback_excludes_second_listener_and_rebinds_after_completion(self):
        probe = socket.socket()
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
        probe.close()
        result, done = {}, threading.Event()
        server = ost._CallbackServer(("127.0.0.1", port), ost._callback_handler("s", result, done))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with self.assertRaises(OSError):
                second = ost._CallbackServer(("127.0.0.1", port), ost._callback_handler("s", {}, done))
                second.server_close()
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/callback?code=fake-code&state=s") as response:
                self.assertEqual(response.status, 200)
        finally:
            server.shutdown()
            server.server_close()
        again = ost._CallbackServer(("127.0.0.1", port), ost._callback_handler("s", {}, done))
        again.server_close()

    def test_real_task_lifecycle_with_future_disabled_trigger(self):
        name = "oura-stress-telegram-test-" + uuid.uuid4().hex
        xml = ost.windows_task_xml(ost.windows_pythonw(), ROOT / ost.SCRIPT_NAME,
                                  self.root, 5, ost.windows_user_sid(), "no-network",
                                  start="2099-01-01T00:00:00", enabled=False)
        try:
            self.assertFalse(ost.windows_task("query", name=name)["exists"])
            task = ost.windows_task("register", xml, name=name)
            self.assertTrue(task["exists"])
            self.assertFalse(task["enabled"])
            self.assertEqual(ost.windows_task_fields(task["xml"]), ost.windows_task_fields(xml))
            self.assertTrue(ost.windows_task("query", name=name)["exists"])
            self.assertFalse(ost.windows_task("disable", name=name)["enabled"])
        finally:
            ost.windows_task("uninstall", name=name)
        self.assertFalse(ost.windows_task("query", name=name)["exists"])

    def test_real_scheduler_execution_when_interactive_session_exists(self):
        interactive = self.ps("[Environment]::UserInteractive")
        if interactive.returncode or interactive.stdout.strip() != "True":
            self.skipTest("CI has no interactive user session; registration lifecycle is tested separately")
        name = "oura-stress-telegram-test-" + uuid.uuid4().hex
        xml = ost.windows_task_xml(ost.windows_pythonw(), ROOT / ost.SCRIPT_NAME,
                                  self.root, 5, ost.windows_user_sid(), "scheduled-native",
                                  start="2099-01-01T00:00:00")
        since = time.time()
        try:
            ost.windows_task("register", xml, name=name)
            ost.windows_task("run", name=name)
            self.assertEqual(ost.wait_for_scheduled_run(self.paths, since, run_id="scheduled-native"),
                             "error: setup is not finished")
        finally:
            ost.windows_task("uninstall", name=name)

    def test_uninstall_data_closes_lock_before_removing_it(self):
        ost.write_json_private(self.paths.config, {"value": "fake"})
        with ost.run_lock(self.paths) as acquired:
            self.assertTrue(acquired)
            ost.delete_owned_files(self.root, ost.OWNED_DATA_FILES, remove_lock=False)
            self.assertTrue(self.paths.lock.exists())
        ost.delete_owned_files(self.root, (), remove_lock=True)
        self.assertFalse(self.root.exists())


if __name__ == "__main__":
    unittest.main()
