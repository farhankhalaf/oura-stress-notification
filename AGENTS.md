# Set up Oura stress alerts for this person

Use this guide for installation or setup requests. For development or review requests, use the [SETUP.md developer section](SETUP.md#for-developers) and [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md); do not start account setup or install a background job unless requested.

Assume the person is not a developer. Their request may be only "Set this up" plus the repository URL. Do the technical work yourself and guide them through account steps one at a time. Do not stop at a plan or a list of commands.

**Done means both:** the person confirms the test as an iOS notification with Telegram in the background, and the connection check and scheduler verification described in section 3 pass. A successful send response or a message in Telegram Web alone does not verify phone delivery.

## How to help

- Explain the next action in plain English: where to click, what to paste, and what they should see. Avoid unexplained terms such as OAuth, PKCE, launchd, cron and environment variables.
- Handle downloading, choosing Python, running commands and checking results. Ask the person only for steps that need their account access, consent or private input.
- Never ask them to paste a bot token or Client Secret into the AI chat. Use the setup program's hidden input in a terminal they control. Existing privately supplied environment variables are also supported; never print their values.
- Never print, copy, commit or upload `~/.config/oura-stress-telegram/` or its contents.
- Have the person complete Oura or Telegram sign-in if needed. Do not sign in for them unless they explicitly ask you to.
- For ordinary installation, do not edit `oura_stress_telegram.py` to work around a failure. Use the troubleshooting guidance, report a clear blocker, or help prepare an issue without secrets. A maintainer's explicit development request is separate from installation.
- If your agent environment blocks network, file or scheduler access, use its normal permission flow or the person's own Terminal. Verify in that user environment before calling a restriction a program failure.
- Use a new Telegram bot dedicated to this tool. Do not reuse a bot another program already polls.

## 1. Check the computer and get the code

Use a Mac or Linux computer. On Windows, explain that it is not supported yet and stop before installing anything.

Find Python 3.9 or newer by running `python3 --version`. Use its actual path consistently for setup and later commands. No pip packages, Node, Docker or other project dependencies are needed.

If Python is missing, guide the person through the Mac's offered command line developer tools, or a supported Python from python.org. Explain that this is a prerequisite the agent will use, not something they need to learn. For a python.org installation on macOS, run **Install Certificates.command** in that version's Applications/Python folder before setup, as described in the [Python macOS installation guide](https://docs.python.org/3/using/mac.html). Do not claim setup is complete while installation is pending.

Put the project in a permanent folder such as `~/oura-stress-notification`. If it already exists, inspect and reuse it without overwriting local changes.

- If Git is already available, clone `https://github.com/fkb032/oura-stress-notification.git` there.
- If Git is unavailable, download `https://github.com/fkb032/oura-stress-notification/archive/refs/heads/main.zip` and extract it there using available download/archive tools. The person does not need to install Git.

Read [SETUP.md](SETUP.md) for requirements and reference before continuing. Do not run the release checklist or fault-injection tests during a person's installation.

## 2. Start the guided setup

Explain: "I'll set up the program. You'll create a sender for your Telegram alerts, give it permission to read Oura, and check one test notification on your phone."

Run the chosen Python with `oura_stress_telegram.py setup` from the project folder in a real interactive terminal or PTY. Stay with it through every prompt.

If your terminal tool cannot let the person enter private values, help them open their own Terminal and give them one exact command with the real project path. Continue guiding the prompts and return to verification afterward. Do not leave them with an unexplained command and call the task done.

If setup already has their Telegram or Oura app details, keep them unless the error says those details are rejected.

### Telegram

Open [Telegram Web](https://web.telegram.org/) or Telegram Desktop on the computer used for setup. Have the person sign in themselves, using the phone's QR-code login if offered. This puts BotFather and the terminal on the same computer so they can copy the token directly into the hidden prompt without retyping it or sharing it in AI chat.

1. Have them open the official [@BotFather](https://t.me/BotFather) in Telegram and send `/newbot`.
2. Suggest the display name **Oura Stress Alerts**. They choose an available username ending in `bot`; explain that the username must be unique if their first choice is taken.
3. They copy the token from BotFather on the computer and paste it into the hidden setup prompt in their terminal. Explain that no characters appear while pasting; press Enter once after pasting.
4. They open their new bot, press **Start**, and send the six-character pairing code shown by setup as a normal private message.
5. Confirm the bot's pairing confirmation arrives. That verifies the chat connection; the phone notification is checked separately below.

### Oura

Have them sign in at <https://developer.ouraring.com/applications> and choose **Create New**. Explain that Oura calls this an "application", but they are only filling in a connection form.

Provide these values so they do not have to invent them:

| Field | Value |
|---|---|
| Display Name | `Oura stress alerts` |
| Description | `Personal Telegram alerts when Oura records more high stress.` |
| Contact Email | Their own email address |
| Website | `https://github.com/fkb032/oura-stress-notification` |
| Privacy Policy | `https://github.com/fkb032/oura-stress-notification` |
| Terms of Service | `https://github.com/fkb032/oura-stress-notification` |
| Redirect URIs | `http://localhost:8765/callback` |
| Scopes | Select **Daily** |

The repository links are for this personal setup. Have them review and accept the Oura API Agreement and create the app. They paste the displayed **Client ID** and **Client Secret** into the setup prompts, keeping the secret out of chat.

When the consent screen opens, tell them to turn on **Sleep, readiness, and activity**, then press **Allow**. That switch is the Daily permission, including the stress read this tool needs. Clicking Allow with the switch off is not enough. A separate sign-in may appear even if the developer portal is already signed in.

### Automatic checks

Answer **Y** to automatic background checks as part of the requested setup. The program tests the scheduled command and then waits for the scheduler to run it. Confirm those checks succeed before moving on. On macOS, explain that a notice about Python running in the background is expected for this job; keep it enabled if they want automatic checks.

## 3. Verify the result on their phone

Run with the same chosen Python:

```bash
python3 oura_stress_telegram.py status
python3 oura_stress_telegram.py test
```

Check that `status` shows the connection and installed background checks. A successful run has outcome `ok` or `ok: alert sent`. If setup's verification check passed but the scheduler reports `skipped: quiet hours`, the scheduler is working and waiting for quiet hours to end; explain that rather than reinstalling or claiming a stress read occurred in that scheduled run. Other skips, paused, failed and degraded results need investigation. "No stress data for today yet" can be normal; it does not prevent the Telegram test.

On iPhone, guide them to **Settings > Notifications > Telegram**. Allow notifications and enable **Lock Screen** or **Banners**. Let them choose when message previews appear; do not silently change their privacy preferences. Check Focus or Do Not Disturb if delivery is delayed.

Before sending the test, have them put Telegram in the background: lock the iPhone if Lock Screen alerts are enabled, or go to the Home Screen if testing Banners. Then run `test` and ask whether it appeared on the lock screen or as an iOS banner while Telegram was in the background. Expect **🧪 Test from Oura stress alerts. Telegram works.** Real stress alerts use the wording pictured in the README. An in-app Telegram banner, a chat message or a computer notification does not pass this phone-push check. If phone confirmation is unavailable, explicitly report it as unverified instead of claiming completion.

For Linux, verify the actual systemd timer or cron run rather than relying on a successful install command. Cron remains experimental. Explain the logout limitation and the installer's option to keep running after logout.

## 4. Finish with a short handoff

Tell the person:

- Which bot sends the alerts, and that the phone test and automatic checks passed.
- The computer needs to stay awake. Oura updates can arrive late, so alerts report recorded stress rather than an instant reading.
- Quiet hours are midnight to 8 AM by default. They can ask their agent to change the schedule or stop the alerts.

Provide the exact command to stop the job, using the chosen Python and an absolute script path. Explain that `uninstall` keeps their saved connection; `uninstall --delete-data` also removes saved keys. Do not delete data unless requested.

## When something goes wrong

- **Missing Daily permission during setup:** run `setup` again, keep the saved app details, and enable **Sleep, readiness, and activity** on the consent screen. Finish the automatic-checks step afterward.
- **Rejected app keys:** run `setup`, answer **n** when asked to keep Oura app details, and enter the correct Client ID and Client Secret.
- **Oura's own sign-in or consent error page:** press Ctrl+C and restart the command. If it repeats, check the Client ID and Daily scope in the registered app before reentering its details.
- **Failed localhost return:** paste the full address from the browser into the waiting terminal. It includes a temporary login code, so keep it out of chat and logs.
- **No stress data yet:** have them sync the ring through the Oura app. Daytime Stress needs a supported ring, active membership and a few days of wear.
- **Telegram polling conflict:** create a new dedicated bot; do not stop another program's bot.
- **Connection works but no schedule exists:** run `install`, then check `status` again. Reconnecting alone does not install automatic checks.
- **Other failures:** use [SETUP.md troubleshooting](SETUP.md#troubleshooting). Report the exact safe error and what is still unverified. Do not claim success or invent a provider outage.

## Advanced setup, only when needed

Existing private environment values can be used: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (skips pairing), `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`. Do not make environment-variable setup the default for a nontechnical person. Secrets are never accepted as command-line arguments.

| What | Location |
|---|---|
| Keys, login, settings, state | `~/.config/oura-stress-telegram/` or `$OURA_STRESS_HOME` |
| Installed script | `~/.local/share/oura-stress-telegram/oura_stress_telegram.py` |
| macOS schedule and log | `~/Library/LaunchAgents/local.oura-stress-telegram.plist`, `~/Library/Logs/oura-stress-telegram.log` |
| Linux schedule | systemd user timer `oura-stress-telegram.timer`, or a crontab line tagged `# oura-stress-telegram` |
