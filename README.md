# Oura stress alerts on Telegram

Get a gentle Telegram nudge when your Oura ring notices you have been stressed.

> 🔴 **Oura recorded high stress:** 15 min today.
>
> Your body has been showing physiological stress. If it fits, take a short break, a few slow breaths, or a walk.

Later in the day, if more stress shows up:

> 🔴 **More high stress recorded:** +15 min (30 min today).

## How it works

- A small program on your computer asks Oura every 5 minutes how much time you have spent in **high stress** today.
- When that number goes up, it sends you a Telegram message.
- Your keys stay on your computer. Nothing goes anywhere except between your computer, Oura and Telegram.

## What you need

- **An Oura Ring Gen3 or Ring 4** with an **active Oura Membership**.
- **Daytime Stress showing in your Oura app.** Oura needs about 5 days of wear before it appears.
- **Telegram** on your phone.
- **A Mac or Linux computer** that is on during your day. Checks run while you are logged in and the computer is awake. On Linux, systemd is recommended; cron works but is experimental.
- **10 to 20 minutes.**

Windows is not supported yet.

## The easy way: ask your AI assistant

If you use an AI coding assistant on your computer (Claude Code, Codex, Cursor or similar), paste this to it:

```text
Set up https://github.com/fkb032/oura-stress-telegram for me so I get Telegram
alerts when my Oura ring records stress. Follow the AGENTS.md file in that repo.
```

It will guide you through everything. A few steps only you can do, and it will tell you when:

1. Create a Telegram bot (a 1 minute chat with Telegram's @BotFather).
2. Register a free "application" on Oura's website. This is how Oura lets you connect your own data now.
3. Log in to Oura in your browser and press **Allow**.
4. Type your keys into the setup program in your own terminal window. Do not paste them into the AI chat.

## Doing it yourself

**1. Get the code.** Click the green **Code** button on this page, then **Download ZIP**, and unzip it somewhere permanent, such as your home folder. Or, if you know git:

```bash
git clone https://github.com/fkb032/oura-stress-telegram.git ~/oura-stress-telegram
```

**2. Open Terminal** (on a Mac: press Cmd+Space, type "Terminal", press Enter) and go to the folder:

```bash
cd ~/oura-stress-telegram
```

**3. Check Python:**

```bash
python3 --version
```

You need 3.9 or newer. On a Mac, if a window asks to install "command line developer tools", click **Install**, wait for it to finish, then run the command again.

**4. Run setup and follow the prompts:**

```bash
python3 oura_stress_telegram.py setup
```

Setup walks you through three parts:

- **Telegram.** In Telegram, message **@BotFather**, send `/newbot`, choose a name and a username ending in `bot`. Paste the token it gives you into setup. Then open your new bot, press **Start**, and send it the 6 character pairing code that setup shows you.
- **Oura.** Go to [cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications), log in, and create a new application. Any name works. Set the **Redirect URI** to exactly:

  ```text
  http://localhost:8765/callback
  ```

  Save it, then paste the **Client ID** and **Client Secret** into setup. Your browser opens Oura's login page. Log in and press **Allow**.
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
- **If something breaks**, you get a Telegram message saying so. If Oura ever stops accepting the saved login, the message includes the exact command to reconnect.
- **Use a new bot just for this.** If another program already reads the same bot's messages, setup will tell you to create a new one.
- **This is not medical advice** and is not affiliated with Oura or Telegram.

## Troubleshooting

| Problem | What to do |
|---|---|
| "No stress data for today yet" | Open the Oura app so the ring syncs. Daytime Stress needs Gen3 or later, an active membership and about 5 days of wear. |
| "Python cannot verify secure connections" | If you installed Python from python.org, open its folder in Applications and run **Install Certificates.command**. |
| Oura says the redirect URI is invalid | In your Oura application, the Redirect URI must be exactly `http://localhost:8765/callback`. |
| The browser shows an error page after you press Allow | Copy the full address from the browser's address bar and paste it into the setup window. |
| The pairing code did not reach the bot | Open your bot in Telegram, press Start, then send the code as a normal message. |
| No alerts at all | Run `status` and look at "Last background run". On a Mac the log is in `~/Library/Logs/oura-stress-telegram.log`. |
| Linux: checks stop when you log out | Run `loginctl enable-linger $USER`, or answer yes when `install` offers it. |

## Privacy and security

- Your Telegram bot token, Oura app keys and Oura login are saved in `~/.config/oura-stress-telegram/`, readable only by your user account.
- The program only asks Oura for **daily** data and only reads the daily stress summary.
- Telegram messages pass through Telegram's servers like any bot message. They contain only minutes of stress.
- To remove everything: run `uninstall --delete-data`, delete your application at [cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications), and delete the bot by sending `/deletebot` to @BotFather.

## Project status

Version 0.1.0. Automated tests run on macOS and Linux. A full run with a freshly registered Oura application is tracked in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) and is still pending. Please [open an issue](https://github.com/fkb032/oura-stress-telegram/issues) if anything is confusing or broken.

## For developers

One file, Python standard library only, Python 3.9+.

```bash
python3 -m unittest discover -s tests -v
```

Oura retired personal access tokens in December 2025, so this uses OAuth2: authorization code with PKCE, a one-time local callback on `localhost:8765`, and automatic refresh. Oura refresh tokens are single use, so each new token pair is saved before it is used, and every command that touches tokens shares one file lock.

## License

[MIT](LICENSE)
