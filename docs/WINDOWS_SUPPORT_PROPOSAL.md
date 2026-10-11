# Native Windows support proposal

Status: proposal reviewed with Opus 5.5 in two rounds, scoring 75 then 87. The review reached its round limit. Implementation and automated validation are complete. A final one-round Opus 5.5 light review at xhigh scored 85; supported follow-up fixes were tested without another model round. No proposal convergence or post-fix model score is claimed.

## Outcome

A person on Windows can give an agent this repository and say "Set this up".
The agent uses ordinary PowerShell, runs the same guided setup, connects Oura and
Telegram, and installs automatic checks without administrator access or a stored
Windows password. The computer must be awake and the person signed in. Windows
support is initially experimental because a real account setup on Windows is not
available for this release. Automated Windows tests are still required where CI
can run them; they do not count as live Oura, Telegram or phone delivery tests.

Keep the program one Python file, standard library only, Python 3.9 or newer.
Target native Windows 10/11 with Windows PowerShell 5.1 and a supported Python
runtime installed using the Python install manager from python.org (existing
traditional Python installations remain usable). Do not require WSL, Docker, pip packages or an executable installer.
Keep existing Mac/Linux identifiers, paths, alert rules and OAuth semantics.

## Changes

1. **Windows paths and credential files.** Use
   `%LOCALAPPDATA%\oura-stress-telegram` for data and a sibling
   `%LOCALAPPDATA%\oura-stress-telegram-app` folder for the installed script. Preserve `OURA_STRESS_HOME` and add a global `--data-dir`
   option so scheduled actions and recovery commands can select an exact folder
   without shell environment syntax. Keep existing POSIX paths unchanged.
   On Windows, apply an allow-listed NTFS DACL granting full control to the current
   user SID, SYSTEM and local administrators, with inheritance for files inside the private folder.
   Use stdlib ctypes with explicit Win32 argument/result types, obtain the process
   token's user SID, and use SetNamedSecurityInfoW rather than treating chmod as
   Windows security. Read back the DACL with GetNamedSecurityInfoW before deciding to apply it. Do
   not re-apply an inheritable ACL on every save. Only provision a new or empty
   dedicated directory, or repair an existing directory whose contents are all
   program-owned files. Refuse an insecure pre-existing directory containing
   unrelated files rather than recursively changing their permissions. Check
   existing owned files without changing unrelated siblings. Setup, install and
   status validate protection. New temp files inherit the private parent DACL;
   fail before writing secrets if the volume cannot enforce it, including FAT or
   exFAT. Do not change unrelated parent directories. Retain flush, fsync, atomic
   replacement and cleanup; close descriptors before cleanup. Retry Windows
   PermissionError from os.replace for at most one second to tolerate a reader or
   scanner holding the destination briefly, retaining the temp file until success
   or final cleanup. Test both transient and persistent sharing violations.
   Detect the legacy Windows ~/.config/oura-stress-telegram folder and explain how
   to explicitly reuse it with --data-dir rather than silently ignoring saved keys.
   No credentials in task definitions, scripts or arguments.

2. **One real interprocess lock.** Keep flock on POSIX. On Windows use
   msvcrt.locking with LK_NBLCK on byte zero of the same persistent lock file,
   with the same immediate-skip and bounded-wait semantics, explicit unlock and
   guaranteed close. Locking may extend beyond EOF, so do not append initialization
   bytes or modify a region held by another process. Never silently run unlocked
   on an unsupported platform. Verify contention and release between real processes.

3. **OAuth console behavior.** Windows select cannot poll stdin like Unix.
   Use nonblocking msvcrt console input for the paste-the-address fallback while
   continuing to watch the callback event. Keep the temporary callback URL hidden and say so. Handle Enter,
   backspace, Ctrl+C and extended keys; do not leave a reader thread that can
   swallow the next setup prompt. Check an actual Windows console input handle,
   tolerate pythonw streams being None, and drain pending paste characters on
   callback completion. On Windows disable SO_REUSEADDR so a second authorization attempt sees a busy
   port and uses the fallback instead of stealing a callback. Native CI must prove
   both simultaneous bind rejection and immediate reuse after a finished callback. Retain state/PKCE and dual loopback
   callbacks. Use UTF-8 for saved JSON/logs and suitable console handling.

4. **Windows recovery commands and execution.** Generate PowerShell commands
   using the call operator and literal single-quote escaping, including PowerShell's
   typographic single-quote delimiters, with an absolute console interpreter,
   script and --data-dir. Task actions use a direct executable and
   subprocess.list2cmdline arguments, never cmd /c or shell interpolation. Use
   pythonw.exe for scheduled runs so a console does not flash every five minutes;
   separate the console python.exe path used in all recovery/status/setup commands
   from the matching pythonw.exe used only in the task action. Verify both exist
   and reject unresolved WindowsApps execution aliases. Resolve sys.executable
   from the selected runtime so install-manager aliases are not persisted. Reject
   task paths containing a %NAME% pair because Task Scheduler expands environment
   references even without a shell; unpaired literal percent signs are allowed.
   Add a hidden
   scheduled-run option to send stdout/stderr to the protected check.log rather
   than assuming pythonw supplies streams. Preserve minimal system environment
   values Windows needs (SystemRoot, user profile, local app data, temp paths).

5. **Native Task Scheduler.** Use built-in Windows PowerShell's Task Scheduler
   COM interface and generated XML, avoiding localized schtasks table parsing.
   Address one task per user using a name containing that user's SID. Register an
   InteractiveToken/LeastPrivilege task with a repeating time trigger and no logon trigger; five minutes by default. Allow battery operation,
   start after missed runs, do not wake the computer, prevent overlapping task
   instances, and set a ten-minute hard execution limit. Launch the absolute
   %SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe with -NoProfile,
   -NonInteractive and a fixed -EncodedCommand script. Send operation data as JSON
   on stdin. Set both console encodings to UTF-8 and explicitly encode/decode UTF-8
   in Python. Do not concatenate executable user input. Treat managed-machine
   language restrictions or COM failures as actionable failures. Normal users should not need elevation. Distinguish a missing task
   by its HRESULT from access/service/query failures. Installation runs the exact pythonw task command with the log option and
   --data-dir plus verification/run-ID flags, registers the task, validates the
   parsed action/principal/settings from read-back (not raw XML byte equality),
   starts it and waits for a fresh scheduler receipt bound to that installation's
   run ID before reporting success. Use the user SID for the principal. The repeating trigger resumes after sign-in;
   no logon trigger with uncertain standard-user permissions is needed.
   Document normal non-elevated PowerShell and never request an administrator
   password. A different administrator account would create a different user's
   installation; it is not the supported agent-led setup path.
   Status distinguishes absent, disabled, ready/running and query failure.
   Settings updates replace this user's task. Uninstall disables the task,
   waits for its current bounded run to finish, deletes it, and verifies absence
   before removing owned data; a query or stop failure must not claim removal.

6. **Single-process Windows timeouts.** Replace the proposed supervisor and job
   object with the reviewer's simpler timer/SIGINT design. Keep the existing
   POSIX SIGALRM path. On Windows a daemon threading.Timer sets an expired flag
   and calls _thread.interrupt_main(); a temporary SIGINT handler raises RunTimeout
   for that deadline and preserves normal Ctrl+C behavior otherwise. Cancel/join
   the timer and restore the previous handler on all exits, testing cancellation
   races and later Ctrl+C. Reuse the existing RunTimeout cleanup while holding the
   file lock, with no further HTTP requests after timeout. This is a soft 120-second
   deadline (plus the existing verification lock allowance): a blocking native
   operation or DNS lookup can delay delivery. Keep HTTP request timeouts and
   use Task Scheduler's ten-minute ExecutionTimeLimit as the scheduled hard stop.
   Do not claim an exact 120-second Windows wall-clock bound or that the interactive
   CLI has a hard process deadline. One process means no orphan worker/token writer.
   A forced stop during refresh can need the existing reconnect path. Under the
   lock, clean stale token temp files left by a killed run (token writers all hold
   that lock). Do not sweep config or last-run temp files that another command
   might still be writing; normal finally cleanup and uninstall own those. During uninstall
   wait for the task to finish up to its hard limit, report if still running, and
   do not delete data then. Delete data under the lock, release/close the lock, and
   only then remove the sentinel and empty folder. The script uses a sibling
   directory to avoid nested cleanup-order problems. Never delete unrelated files.

7. **Tests and CI.** Keep Linux 3.9/3.13 and macOS checks. Add Windows Python
   3.9, 3.13, 3.14 and 3.15 jobs with no Oura or Telegram secrets. Make POSIX-specific
   shell, permission and hard signal timing assertions conditional, with native
   Windows equivalents for ACL read-back, two-process locks, atomic writes while a
   destination is held open, PowerShell recovery command execution, soft timeouts,
   callback port exclusion and console input. Mock error boundaries in unit tests,
   but also unconditionally run the real PowerShell 5.1/COM task lifecycle on
   Windows CI: register an InteractiveToken task with a unique test name, read it
   back, compare parsed action/principal/triggers/settings, disable it, query state,
   delete it and prove absence. Cleanup runs in finally. Only actual scheduled
   execution is conditional on having a logged-in interactive token. Use real
   filesystem paths containing spaces, ASCII/typographic apostrophes, non-ASCII,
   ampersand and an unpaired percent sign. Test rejection of %NAME% pairs. Windows
   forbids literal < and > in filenames, so exercise XML escaping with those in
   pure serialization tests instead. Use explicit Windows PowerShell 5.1 even
   when Actions' default shell is pwsh. Assert the local CLI and installed pythonw
   both run against an isolated temporary data folder without network; verify
   recovery messages generated with sys.executable=pythonw refer to python.exe.
   Record that hosted-runner task registration does not prove a standard-user
   consumer setup; report the observed CI privilege/session context. No live API
   calls, login, phone delivery, Windows logout/login or nontechnical-user claims.

8. **Documentation and release.** Update AGENTS.md and SETUP.md with agent-led
   Windows setup, Python install-manager guidance and runtime selection, PowerShell commands, paths,
   limitations, troubleshooting and uninstall. Certificate-error guidance must be
   platform-specific, without telling Windows users to run a macOS certificate script. Keep the README short. Its first
   paragraph becomes "A gentle push notification on your iPhone when Oura records
   more high stress. Free and open source." Remove the separate "Runs on your Mac
   or Linux computer. No coding required." line. Keep setup prompt before image. The latest requested media are two GIFs:
   a realistic iPhone simulation and an explicitly illustrated walkthrough.
   Both show a Telegram alert, unlocking, opening Oura, tapping Stress and viewing
   a reference-matched Daytime Stress chart that first enters stress at 3 PM.
   The graph has no later readings. Background and notification use example data.
   The user supplied screenshots and authorized iPhone Mirroring as reference;
   real private screenshots and readings are not published. Both GIFs will receive
   the final Opus 5.5 light review at the explicitly requested xhigh effort.
   Bump to 0.2.0 for the added platform and record automated evidence and absent
   live Windows testing in RELEASE_CHECKLIST.md. Do not reinstall the Mac job,
   touch the separate private monitor or expose saved credentials.

## Review and publication

Run the requested deep review of this proposal with Opus 5.5, adjudicate material
findings and use at most its one revision round. Implement after that review,
run both local Python suites and Windows CI, then perform the requested one-round
Opus 5.5 light review of the final implementation. Apply supported findings,
rerun affected checks and publish to main with Farhan's existing author identity.
Follow CI and comments for the final commit. Report post-review fixes honestly
without implying they received an extra review. No further routine approval gate.

## Evidence and constraints

The present code has explicit Mac/Linux-only scheduling, POSIX chmod/fchmod,
flock with an unsafe unlocked fallback, stdin select polling, Unix shell recovery
commands and a no-op non-SIGALRM timeout fallback. The current 80-test suite has
POSIX-specific assertions. Alert rules, OAuth HTTP fields and Telegram calls can
remain shared. No new messaging platform or hosted service is included.

Official references consulted on 2026-10-10:

- [Python msvcrt locking and console input](https://docs.python.org/3/library/msvcrt.html)
- [Python os permissions and Windows limitations](https://docs.python.org/3.13/library/os.html)
- [SetNamedSecurityInfoW](https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setnamedsecurityinfow)
- [Task Scheduler RegisterTask](https://learn.microsoft.com/en-us/windows/win32/taskschd/taskfolder-registertask)
- [PowerShell quoting](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules)
- [Windows exclusive socket binding](https://learn.microsoft.com/en-us/windows/win32/winsock/using-so-reuseaddr-and-so-exclusiveaddruse)
- [Windows inherited ACL propagation](https://learn.microsoft.com/en-us/windows/win32/secauthz/automatic-propagation-of-inheritable-aces)
- [Python Windows installation](https://docs.python.org/3/using/windows.html)
- [Task Scheduler triggers](https://learn.microsoft.com/en-us/powershell/module/scheduledtasks/new-scheduledtasktrigger)

## Implementation decisions after round two

The Store-runtime check runs before prompts or saved-data writes, including when
Store Python is the base of a virtual environment. The logon trigger was removed.
Task Scheduler's omitted default XML fields are interpreted by their schema
values, and a per-installation run ID is embedded in the saved action. Windows
PowerShell runs without a shared console, keeping the user's console encoding
unchanged. Native callback re-bind is tested. DACL checking accepts the current
user, SYSTEM and local administrators, including SDDL's local account aliases
when they refer to the exact current user. New directories start private.
The timer is disarmed, cancelled and joined before its SIGINT handler is restored.

The later GIF requests supersede the earlier static-graphic description. They
provide authorization for the two animated versions and their editable artwork
source; no extra publication approval is required. Final implementation and
visual review are separate from this proposal's two rounds.
