# Release checklist

Automated tests mock Oura and Telegram. Before calling a version tested end to end,
do this once on a real account and record the date and result below.

## Distribution acceptance

The release succeeds when a nontechnical person can give an agent the public
GitHub URL and say "Set this up", then receive a test notification on their phone
with automatic checks running. A working API call or a Telegram Web receipt is
not sufficient for this acceptance check.

- Start from the public README and its copyable agent request, on a fresh account
  or clean machine. Follow AGENTS.md without unexplained developer steps.
- Confirm the agent handles downloading, Python selection, setup and verification,
  including a path that does not require Git.
- Record where the person needed account sign-in, consent or private key entry,
  and any point where they were unsure what to do next.
- On iPhone, confirm a real test notification appears outside the Telegram chat.
  Check that the notification matches the example wording. The README image is
  explicitly illustrative and is not evidence of this real-device check.
- Confirm automatic checks, a simple way to change quiet hours, and a clear way
  to stop the alerts. Record time and assistance rather than estimating them.

**Not yet verified:** a fresh nontechnical user's complete agent-led setup and
an actual iPhone push notification. The earlier live run verified Telegram Web
receipt, not the phone notification. A real iPhone screenshot can replace the
illustrative README image after that device check.

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
| 2026-10-10 | 0.1.0 | Farhan + Codex | macOS 26.5.2 (arm64) | Passed the tested macOS setup and recovery paths after the live-tested fixes; later review-driven fixes are unit-tested only: fresh app, Telegram pairing/delivery, automatic and pasted callbacks, real stress read, launchd startup, forced refresh and spent-token recovery. 80 tests pass on both local Python versions after follow-up review fixes. Exceptions: assisted existing account without timing; logout/login and revocation await approval; live Linux scheduling not tested. |

### 2026-10-10 live run details

- **Step 1, passed:** registered a fresh app in the new developer portal. The old
  `cloud.ouraring.com/oauth/applications` page no longer creates applications.
  Required fields: Display Name, Description, Contact Email, Website, Privacy
  Policy, Terms of Service and Redirect URIs, plus acceptance of the Oura API
  Agreement. The repository URL was accepted for all three website/policy/terms
  fields. Redirect: `http://localhost:8765/callback`. Initially selected only
  Daily. The first successful stress read occurred before the app owner enabled
  additional app scopes, so Daily-only registration was exercised. The tool's
  OAuth requests remained `scope=daily` throughout.
- **Step 2, deviation:** an agent assisted on the existing main macOS account,
  with developer tools already installed. No clean-account test or stopwatch
  measurement was performed.
- **Step 3, passed:** a new Telegram bot was created and paired in the preceding
  setup session. The pairing code and confirmation were verified in Telegram Web.
- **Step 4, passed with a deviation:** automatic localhost return completed.
  Separately reserved both callback addresses on port 8765, ran `connect-oura`
  in a terminal, and pasted the failed browser callback address. Reconnection
  and a subsequent check succeeded. After consent-page errors, this manual test
  used Oura's documented alternate `https://developer.ouraring.com/authorize`
  URL with the original query, state and PKCE values. The normal setup and later
  recovery command used the unchanged default authorization URL. Some consent
  attempts returned Oura's generic HTTP 400 page; a fresh attempt succeeded.
- **Step 5, passed:** `test` printed today's real stress minutes. Both the test
  message and a real stress alert were visible in Telegram Web. Personal stress
  values are intentionally omitted from this public result.
- **Step 6, passed for installation/startup:** answered Y during setup. The
  verification check succeeded, launchd started its own successful check, and
  `status` showed the installed five-minute schedule. After the fixes, reinstalled
  and verified the scheduler again. The installed script matched the source tested at that time (`805ebdd`). **Logout/login remains untested:** approval was requested and had not
  been received during this run.
- **Step 7, passed:** set `expires_at` to the past under the shared token lock,
  ran `check`, and confirmed a different refresh token, a future expiry and an
  `ok` result without displaying credentials.
- **Step 8, passed after a fix:** saved a private token copy, forced a successful
  rotation, restored the spent token, and ran `check`. Oura returned HTTP 400
  `invalid_request` with `Invalid request`, rather than the mocked
  `invalid_grant`. The original code failed without sending the pause notice.
  Fixed refresh-request rejection handling; rerunning the spent-token check
  paused and delivered the reconnect notice. Ran its exact absolute command
  from `/tmp`, reconnected and confirmed successful checks. Deleted the temporary
  token copy. Temporarily unloaded only this tool's job during token fault
  injection, then restored and verified it.
- **Additional fix:** declining Daily consent produced HTTP 401 with
  `Token is not authorized access daily scope.` The tool now explains the
  missing permission, pauses without an unnecessary token refresh, and directs
  the user to enable **Sleep, readiness, and activity** before pressing Allow.
  Added this instruction to setup, reconnect notices and documentation.
- **Step 9, not run:** approval to revoke the new app's access was requested and
  had not been received during this run. Revocation remains unverified.
- **Step 10, not run:** this live run is on macOS. Linux systemd and cron live
  checks remain unverified; cron remains experimental.
- **Automated checks, passed locally:** all 80 tests using
  `/opt/homebrew/bin/python3 -m unittest discover -s tests -v` (Python 3.14.4)
  and `/usr/bin/python3 -m unittest discover -s tests -v` (Python 3.9.6).
  Regression tests cover the observed spent-token response, missing Daily consent
  and the current registration portal.

The tested macOS paths pass. This is not a complete pass of every checklist item.

### Follow-up code review and cleanup

The first Opus 5.5 deep-review round identified a setup recovery gap: a
missing-permission error pointed to `connect-oura`, which could leave setup
unfinished without a background job. Setup failures now direct users back to
`setup`, preserving saved keys and allowing installation to finish. Standalone
`connect-oura` verifies a real stress read before reporting success and explains
how to install automatic checks when absent. Consent notices distinguish missing
permission from an invalid login; the missing-permission response parser accepts
the observed wording and the grammatical variant with `to access`. Setup prompts
and troubleshooting now match the verified portal and consent flow. These
follow-up changes are covered by isolated regression tests; the interactive
OAuth flow was not repeated after them.

After live validation, the new Mac job was uninstalled to avoid duplicate alerts.
The job and plist were verified absent, and saved settings and the Oura connection
were retained for later testing. Uninstall also retains the installed script
copy. The existing separate monitor was untouched.

The Opus 5.5 review ended at its two-round limit, scoring 85 then 88, rather
than converging. Host corrections after round two distinguish rejected app keys
from missing consent, use the running source for interactive recovery commands,
persist interactive reconnect failures under the read lock, avoid duplicate
Telegram notices after a terminal error, explain saved logins after temporary
read failures, and include a recovery command in paused installation failures.
These final corrections have regression coverage but were not sent for a third
model review. No approval score is claimed for them.

### Distribution guide follow-up

The public README now leads with a copyable agent setup request, explains the
account steps in plain language, includes an illustrative iPhone notification
image with example data, and moves manual terminal setup into an optional section.
AGENTS.md tells installation agents to perform the technical work, provide exact
Oura form values, support downloading without Git, and stay until phone delivery
and automatic checks are verified. This is preparation for the distribution
acceptance test above; it is not a claim that a fresh user or phone test passed.
