# Release checklist

Automated tests mock Oura and Telegram. Before calling a version tested end to end,
do this once on a real account and record the date and result below.

## Live run with a fresh Oura application

1. Register a new application at https://developer.ouraring.com/applications with
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
| 2026-10-10 | 0.1.0 | Farhan + Codex | macOS 26.5.2 (arm64) | Partial, awaiting Oura developer-portal sign-in. Telegram pairing passed. Fixed the obsolete application-registration URL; 69 tests pass on Homebrew Python 3.14.4 and Apple Python 3.9.6. Assisted run on an existing main account, no clean-account timing. Oura and scheduler checks remain pending; Linux live scheduling was not run. |

### 2026-10-10 live run details

- **Step 1, blocked:** the old `cloud.ouraring.com/oauth/applications` page says
  new applications must be created at `developer.ouraring.com`. Updated setup,
  app-key recovery guidance and documentation to use the current portal, with
  regression coverage. The new portal requires sign-in; registration and required
  fields have not yet been verified.
- **Step 2, deviation:** an agent assisted on the existing main macOS account,
  with developer tools already installed. No clean-account test or stopwatch
  measurement was performed.
- **Step 3, passed:** a new Telegram bot was created and paired in the preceding
  setup session. The pairing code and confirmation message were independently
  verified in Telegram Web during this run.
- **Steps 4 through 8, pending:** Oura sign-in is needed before testing either
  callback route, today's stress, the test message, launchd installation, token
  rotation and recovery from a lost refresh response. No background job is
  installed. The macOS logout/login test requires the tester's approval first.
- **Step 9, pending:** revocation requires approval after Oura is connected.
- **Step 10, not run:** this live run is on macOS. Linux systemd and cron live
  checks remain unverified; cron remains experimental.
- **Automated checks, passed locally:** all 69 tests using
  `/opt/homebrew/bin/python3 -m unittest discover -s tests -v` (Python 3.14.4)
  and `/usr/bin/python3 -m unittest discover -s tests -v` (Python 3.9.6).

This partial run does not establish an end-to-end release pass.
