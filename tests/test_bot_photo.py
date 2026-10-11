import email.parser
import email.policy
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import oura_stress_telegram as app


class BotPhotoTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.script = self.root / app.SCRIPT_NAME
        self.script.write_text("# test program\n")
        self.jpeg = b"\xff\xd8\xff\xe0sample-binary-\x00\x80\xff\xd9"
        self.photo = self.root / app.BOT_PHOTO_NAME
        self.photo.write_bytes(self.jpeg)
        self.config = {"telegram_bot_token": "123456:test-token-not-real"}
        patcher = mock.patch.object(app, "__file__", str(self.script))
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_upload_is_valid_multipart_with_exact_jpeg(self):
        def receive(method, url, *, data, headers):
            self.assertEqual(method, "POST")
            self.assertTrue(url.endswith("/setMyProfilePhoto"))
            mime = email.parser.BytesParser(policy=email.policy.default).parsebytes(
                ("Content-Type: " + headers["Content-Type"] + "\r\n\r\n").encode() + data)
            parts = {part.get_param("name", header="content-disposition"): part
                     for part in mime.iter_parts()}
            self.assertEqual(json.loads(parts["photo"].get_content()),
                             {"type": "static", "photo": "attach://avatar"})
            self.assertEqual(parts["avatar"].get_filename(), app.BOT_PHOTO_NAME)
            self.assertEqual(parts["avatar"].get_content_type(), "image/jpeg")
            self.assertEqual(parts["avatar"].get_payload(decode=True), self.jpeg)
            return 200, {}, b'{"ok": true, "result": true}'
        with mock.patch.object(app, "http_request", side_effect=receive):
            self.assertTrue(app.set_bot_photo(self.config))

    def test_setup_preserves_existing_photo(self):
        with mock.patch.object(app, "telegram_call", side_effect=[
                {"id": 123}, {"total_count": 1}]) as api, \
                mock.patch.object(app, "http_request") as upload:
            self.assertFalse(app.set_bot_photo(self.config, only_if_missing=True))
        self.assertEqual(api.call_args.args[1], "getUserProfilePhotos")
        self.assertEqual(api.call_args.args[2], {"user_id": "123", "limit": "1"})
        upload.assert_not_called()

    def test_setup_uploads_when_no_photo_exists(self):
        with mock.patch.object(app, "telegram_call", side_effect=[
                {"id": 123}, {"total_count": 0}]), \
                mock.patch.object(app, "http_request", return_value=(
                    200, {}, b'{"ok": true, "result": true}')) as upload:
            self.assertTrue(app.set_bot_photo(self.config, only_if_missing=True))
        upload.assert_called_once()

    def test_unreadable_photo_state_does_not_overwrite(self):
        for response in ({}, None, {"total_count": -1}):
            with self.subTest(response=response), \
                    mock.patch.object(app, "telegram_call", side_effect=[{"id": 123}, response]), \
                    mock.patch.object(app, "http_request") as upload:
                with self.assertRaises(app.TelegramError):
                    app.set_bot_photo(self.config, only_if_missing=True)
                upload.assert_not_called()

    def test_missing_asset_and_invalid_image_have_actionable_errors(self):
        self.photo.unlink()
        with mock.patch.object(app, "http_request") as upload:
            with self.assertRaisesRegex(app.AppError, "downloaded project folder"):
                app.set_bot_photo(self.config)
            self.photo.write_bytes(b"not a JPEG")
            with self.assertRaisesRegex(app.AppError, "JPEG"):
                app.set_bot_photo(self.config)
            upload.assert_not_called()

    def test_failed_upload_is_reported_without_secret(self):
        output = io.StringIO()
        with mock.patch.object(app, "telegram_call", side_effect=[{"id": 123}, {"total_count": 0}]), \
                mock.patch.object(app, "http_request", return_value=(400, {}, json.dumps({
                    "ok": False, "description": self.config["telegram_bot_token"]}).encode())), \
                mock.patch("sys.stdout", output):
            app.setup_bot_photo(self.config)
        self.assertIn("Skipped the bot picture", output.getvalue())
        self.assertNotIn(self.config["telegram_bot_token"], output.getvalue())

    def test_keep_existing_telegram_also_initializes_missing_photo(self):
        config = dict(self.config, telegram_chat_id="123")
        with mock.patch.object(app, "ask_yes", return_value=True), \
                mock.patch.object(app, "setup_bot_photo") as photo, \
                mock.patch.object(app, "heading"):
            app.setup_telegram(config)
        photo.assert_called_once_with(config)

    def test_new_pairing_continues_when_photo_upload_fails(self):
        config = {}
        with mock.patch.dict(os.environ, {"TELEGRAM_CHAT_ID": "123"}), \
                mock.patch.object(app, "ask_secret", return_value=self.config["telegram_bot_token"]), \
                mock.patch.object(app, "telegram_call", return_value={"id": 12, "username": "demo_bot"}), \
                mock.patch.object(app, "set_bot_photo", side_effect=app.TelegramError("photo failed")), \
                mock.patch.object(app, "send_telegram", return_value=True) as send, \
                mock.patch.object(app, "interactive", return_value=False), \
                mock.patch("sys.stdout", io.StringIO()):
            app.setup_telegram(config)
        self.assertEqual(config["telegram_chat_id"], "123")
        send.assert_called_once()

    def test_installed_program_keeps_asset_for_later_setup(self):
        target = self.root / "installed" / app.SCRIPT_NAME
        with mock.patch.object(app, "installed_script_path", return_value=target):
            self.assertEqual(app.copy_script(), target)
        self.assertEqual(target.with_name(app.BOT_PHOTO_NAME).read_bytes(), self.jpeg)
        self.assertEqual(target.read_bytes(), self.script.read_bytes())

    def test_single_file_install_still_works_without_optional_photo(self):
        self.photo.unlink()
        target = self.root / "installed" / app.SCRIPT_NAME
        with mock.patch.object(app, "installed_script_path", return_value=target):
            self.assertEqual(app.copy_script(), target)
        self.assertTrue(target.is_file())

    def test_command_reports_upload_failure(self):
        with mock.patch.object(app, "load_config", return_value=self.config), \
                mock.patch.object(app, "set_bot_photo", side_effect=app.TelegramError("rejected")), \
                mock.patch("sys.stdout", io.StringIO()):
            self.assertEqual(app.main(["--data-dir", str(self.root / "data"), "set-bot-photo"]), 1)


if __name__ == "__main__":
    unittest.main()
