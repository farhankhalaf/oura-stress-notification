# Release checklist

Automated tests mock Oura and Telegram. Before calling a version tested end to end,
do this once on a real account and record the date and result below.

## Live run with a fresh Oura application

1. Register a new application at https://cloud.ouraring.com/oauth/applications with
   Redirect URI `http://localhost:8765/callback`. Note which fields Oura required.
2. On a clean user account (or a machine without Python developer tools), follow the
   README from the start, timing it.
3. Telegram: create a new bot, pair with the code, confirm the message arrives.
4. Oura: approve in the browser and confirm the automatic return works. Also try the
   paste-the-address fallback once.
5. `test` prints today's stress minutes (or "no data yet") and the Telegram test arrives.
6. Accept background checks. Confirm the verification run passes and `status` shows
   the schedule running. On macOS, log out and back in, then confirm `Last check`
   advances.
7. Force a token refresh: edit `expires_at` in `tokens.json` to a past time, run
   `check`, confirm `tokens.json` now has a new refresh token and the check succeeds.
8. Lost refresh response: copy `tokens.json`, force a refresh, then restore the old
   copy (its refresh token is now spent). Run `check`: expect the "paused, reconnect"
   Telegram message with an absolute command. Run that command and confirm checks resume.
9. Revoke access in the Oura app or website, confirm the same reconnect path.
10. Linux (if available): repeat 6 with the systemd timer, and once with cron
    (cron stays labeled experimental until this passes).

## Results

| Date | Version | Who | Platform | Result |
|---|---|---|---|---|
| | 0.1.0 | | | pending |
