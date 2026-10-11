# Setup and reference

For agent-led installation, follow [AGENTS.md](AGENTS.md). This guide covers requirements, manual setup, settings and troubleshooting.

## What you need

- An **Oura Ring Gen3 or Ring 4**, an active **Oura Membership**, and **Daytime Stress already showing** in the Oura app.
- **Telegram on your iPhone**, with notifications allowed. Other phones with Telegram can receive these alerts too.
- **Telegram on your computer during setup**, using [Telegram Web](https://web.telegram.org/) or the desktop app. This lets you copy the bot token directly into the setup window.
- A **Mac or Linux computer** that stays on during your day. Checks run while the computer is awake; the default setup also requires you to be logged in. Mac has been tested live. Linux scheduling still needs live testing; cron is experimental.
- An AI agent with access to your computer, or the manual instructions below.

There is no separate iPhone app to install. The program runs on your computer; the notification arrives through Telegram. Windows is not supported yet.

## Make sure it reaches your iPhone

Open **Settings > Notifications > Telegram**, turn on **Allow Notifications**, and select **Lock Screen** or **Banners**. Your **Show Previews** setting controls when the message text is visible. Focus or Do Not Disturb may delay notifications. [Apple's notification settings guide](https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios).

Open your new bot in Telegram and press **Start** during pairing. Then put Telegram in the background: **lock your iPhone** to test Lock Screen alerts, or **go to the Home Screen** to test Banners. Have your agent send the test.

Expect **🧪 Test from Oura stress alerts. Telegram works.** Confirm that it appears on the lock screen or as an iOS banner while Telegram is in the background. An in-app Telegram banner or a message on the computer does not pass this check. Real stress alerts look like the illustrated example in [README.md](README.md).

## After setup

- The program checks every **5 minutes** and sends a message when today's high-stress total increases.
- Quiet hours default to **midnight to 8 AM**. Ask your agent to change them or make alerts less frequent.
- Keep the Oura app syncing your ring. Alerts describe **what Oura recorded**, with a delay; they are not an instant stress alarm.
- Ask your agent **"Stop the Oura alerts"** to remove the background job. Your saved connection can be kept for later.

## Manual setup

**1. Get the code.** Download the [project ZIP](https://github.com/fkb032/oura-stress-notification/archive/refs/heads/main.zip). Unzip it, rename the folder to `oura-stress-notification`, and move it into your home folder (on a Mac, the folder with your name and the house icon). Or, if you know git:

```bash
git clone https://github.com/fkb032/oura-stress-notification.git ~/oura-stress-notification
```

**2. Open Terminal** (on a Mac: press Cmd+Space, type "Terminal", press Enter) and go to the folder:

```bash
cd ~/oura-stress-notification
```

**3. Check Python:**

```bash
python3 --version
```

You need 3.9 or newer. On a Mac, if a window asks to install "command line developer tools", click **Install**, wait for it to finish, then run the command again. If you installed Python from python.org, open its folder in Applications and run **Install Certificates.command** before continuing.

**4. Run setup and follow the prompts:**

```bash
python3 oura_stress_telegram.py setup
```

Setup walks you through three parts:

- **Telegram.** In Telegram, message **@BotFather**, send `/newbot`, choose a name and a username ending in `bot`. Paste the token it gives you into setup. Then open your new bot, press **Start**, and send it the 6 character pairing code that setup shows you.
- **Oura.** Go to [developer.ouraring.com/applications](https://developer.ouraring.com/applications), log in, and create a new application. Enter a name, description and contact email. For a personal app, use `https://github.com/fkb032/oura-stress-notification` for Website, Privacy Policy and Terms of Service. Select **Daily** under Scopes. Set the **Redirect URI** to exactly:

  ```text
  http://localhost:8765/callback
  ```

  Accept the Oura API Agreement and create the app, then paste the **Client ID** and **Client Secret** into setup. Your browser opens Oura's login page. Log in, turn on **Sleep, readiness, and activity**, then press **Allow**. This is the Daily permission the tool needs, even for stress data.
- **Background checks.** Answer **Y** when setup asks to check automatically. It runs one real check, installs the background job, and waits until the job has run once by itself.

That is it. Keep the Oura app on your phone so your ring keeps syncing.

## Everyday commands

Run these from the project folder in Terminal.

| What you want | Command |
|---|---|
| See if everything is working | `python3 oura_stress_telegram.py status` |
| Send a test message | `python3 oura_stress_telegram.py test` |
| Change quiet hours, frequency or sensitivity | `python3 oura_stress_telegram.py settings --help` |
| Log in to Oura again | `python3 oura_stress_telegram.py connect-oura` |
| Turn it off | `python3 oura_stress_telegram.py uninstall` |
| Turn it off and delete saved keys | `python3 oura_stress_telegram.py uninstall --delete-data` |

If you move or update the project folder, run `python3 oura_stress_telegram.py install` again.

## Settings

```bash
# No checks between 10 PM and 8 AM (default: midnight to 8 AM)
python3 oura_stress_telegram.py settings --quiet 22:00-08:00

# Check every 10 minutes instead of 5
python3 oura_stress_telegram.py settings --interval 10

# Only message after at least 15 new minutes of high stress (default: any increase)
python3 oura_stress_telegram.py settings --min-increase 15
```

## Good to know

- **Alerts are not instant.** Your ring syncs through the Oura phone app, and Oura updates stress about every 15 minutes while you are awake and still. A message usually arrives 15 to 30 minutes after the stress, sometimes later.
- **It reports what Oura recorded**, not a live reading. A message after a quiet stretch can describe stress from earlier in the day.
- **The default is sensitive:** any new high stress sends a message. Use `--min-increase` if that is too many.
- **If checks keep failing**, you get a Telegram message saying so. If Oura ever stops accepting the saved login, the message includes the exact command to fix it. It cannot tell you if Telegram itself is unreachable or the computer is off, so run `status` now and then.
- **Use a new bot just for this.** If another program already reads the same bot's messages, setup will tell you to create a new one.
- **This is not medical advice** and is not affiliated with Oura or Telegram.

## Troubleshooting

| Problem | What to do |
|---|---|
| "No stress data for today yet" | Open the Oura app so the ring syncs. Daytime Stress needs Gen3 or later, an active membership and about 5 days of wear. |
| "Python cannot verify secure connections" | If you installed Python from python.org, open its folder in Applications and run **Install Certificates.command**. |
| Oura says the redirect URI is invalid | In your Oura application, the Redirect URI must be exactly `http://localhost:8765/callback`. |
| The localhost return page fails after you press Allow | Copy the full address from the browser's address bar and paste it into the setup window. |
| Oura itself shows an error page during sign-in or consent | Press Ctrl+C in the terminal and run the same command again. If the error repeats, check the Client ID and Daily under Scopes, then run setup and enter the app details again. |
| The pairing code did not reach the bot | Open your bot in Telegram, press Start, then send the code as a normal message. |
| No alerts at all | Run `status` and look at "Last background run". On a Mac the log is in `~/Library/Logs/oura-stress-telegram.log`. |
| Linux: checks stop when you log out | Run `loginctl enable-linger $USER`, or answer yes when `install` offers it. |

## Privacy and security

- Your Telegram bot token, Oura app keys and Oura login are saved in `~/.config/oura-stress-telegram/`, readable only by your user account.
- The program only asks Oura for **daily** data and only reads the daily stress summary.
- Telegram messages pass through Telegram's servers like any bot message. Alerts contain only minutes of stress. Problem notices also include the error and the command to run, which shows folder paths on your computer.
- To remove everything: run `uninstall --delete-data`, delete your application at [developer.ouraring.com/applications](https://developer.ouraring.com/applications), and delete the bot by sending `/deletebot` to @BotFather.

## Project status

Version 0.1.0. A fresh agent-led setup by a nontechnical user and delivery to a real iPhone have not been tested yet. The phone image is illustrative. Live macOS setup with a fresh Oura application, Telegram delivery, both callback paths, background startup, token refresh and lost-response recovery were tested on October 10, 2026. The later review-driven recovery fixes are covered by unit tests only; the interactive OAuth flow was not repeated after those changes. Automated tests run on macOS and Linux. Untested cases and test deviations, including logout/login, access revocation and live Linux scheduling, are recorded in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). Please [open an issue](https://github.com/fkb032/oura-stress-notification/issues) if anything is confusing or broken.

## For developers

One file, Python standard library only, Python 3.9+. The script filename, saved-settings folder and scheduler identifiers retain their original names for compatibility with existing installations.

```bash
python3 -m unittest discover -s tests -v
```

Oura retired personal access tokens in December 2025, so this uses OAuth2: authorization code with PKCE, a one-time local callback on `localhost:8765`, and automatic refresh. Oura refresh tokens are single use, so each new token pair is saved before it is used, and every command that touches tokens shares one file lock.

## License

[MIT](LICENSE)
