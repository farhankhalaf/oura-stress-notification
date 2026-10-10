# Instructions for AI agents

You are helping a person, often not technical, set up Oura stress alerts on Telegram. You are done when `status` shows everything working and they have received the test message in Telegram.

## Rules

- **Never ask the person to paste secrets into the chat.** That includes the Telegram bot token and the Oura Client Secret. They type them into the `setup` prompt in their own terminal. If your tool can run an interactive command in their terminal (for example the `!` prefix in Claude Code), you may suggest it.
- **Never print, copy, commit or upload** `~/.config/oura-stress-telegram/` or anything in it.
- **Do not log in to their Oura or Telegram accounts for them** with browser automation unless they explicitly ask you to.
- **Do not edit `oura_stress_telegram.py` to get past a problem.** Report the problem and point them to the README's troubleshooting table or an issue.
- Keep explanations short and concrete. Tell them what they will see and what to click.

## Steps

1. **Check the computer.** macOS or Linux only. On Windows, say it is not supported yet (WSL may work but is untested) and stop.
2. **Check Python:** `python3 --version` must be 3.9 or newer.
   - macOS: if it prompts to install command line developer tools, have them click Install and wait. Alternatively install from python.org and run its "Install Certificates.command".
   - Linux: install `python3` with the system package manager.
3. **Get the code** into a permanent folder, for example `git clone https://github.com/fkb032/oura-stress-telegram.git ~/oura-stress-telegram`. Avoid temporary folders.
4. **Explain what is coming**, in plain words:
   - They will create a Telegram bot with @BotFather and send it a pairing code.
   - They will register a free application at https://developer.ouraring.com/applications with the Redirect URI exactly `http://localhost:8765/callback`, then copy its Client ID and Client Secret.
   - They will log in to Oura in the browser and press Allow.
5. **Have them run setup in their own terminal:**

   ```bash
   cd ~/oura-stress-telegram && python3 oura_stress_telegram.py setup
   ```

   Stay with them through each prompt. Useful details:
   - Oura may ask for website, privacy policy or terms links. The project URL `https://github.com/fkb032/oura-stress-telegram` is fine for a personal app.
   - If the browser shows an error page after Allow, they paste the full address bar URL into the setup window.
   - Answer **Y** to background checks. Setup then runs one real background check.
6. **Verify.** You may run these yourself; they print no secrets:

   ```bash
   python3 oura_stress_telegram.py status
   python3 oura_stress_telegram.py test
   ```

   "No stress data for today yet" is normal early in the day, right after setup, or for new rings. Daytime Stress needs Oura Ring Gen3 or later, an active membership and about 5 days of wear.
7. **Explain how it behaves:**
   - Checks run every 5 minutes while they are logged in and the computer is awake.
   - Alerts usually arrive 15 to 30 minutes after the stress, because the ring syncs through the Oura phone app.
   - Quiet hours default to midnight to 8 AM. Change them with `settings --quiet 22:00-08:00`.
   - To reduce messages: `settings --min-increase 15`.
   - To stop: `uninstall` (add `--delete-data` to remove saved keys).

## Non-interactive setup

Only if the person sets these in their own shell first: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (skips pairing), `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`. Setup still needs them to log in to Oura in a browser. Secrets are never accepted as command-line arguments.

## Where things live

| What | Where |
|---|---|
| Keys, login, settings, state | `~/.config/oura-stress-telegram/` (or `$OURA_STRESS_HOME`) |
| Installed copy of the script | `~/.local/share/oura-stress-telegram/oura_stress_telegram.py` |
| macOS schedule and log | `~/Library/LaunchAgents/local.oura-stress-telegram.plist`, `~/Library/Logs/oura-stress-telegram.log` |
| Linux schedule | systemd user timer `oura-stress-telegram.timer`, or a crontab line tagged `# oura-stress-telegram` |
