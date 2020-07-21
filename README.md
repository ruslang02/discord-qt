# DiscordQt
A Discord desktop client powered by Node.JS and [NodeGUI/Qt](https://github.com/nodegui).
It offers a significantly less resource-consuming experience comparing to the official Electron-based desktop client thanks to native UI rendering instead of a Chromium rendering engine.

![Screenshot](screenshot.png)

## Running from sources
Node.JS v12 or newer is required.
```bash
git clone https://github.com/ruslang02/discord-qt
cd discord-qt/
npm install
npm start
```

## Running binary release
Precompiled builds are available at https://github.com/ruslang02/discord-qt/releases for Windows and Linux (AppImage).

## Configuration
In order to run this application you **must** obtain a Discord user token [(how-to guide)](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs).
You can configure your user accounts in the Accounts settings screen.
There is also a config file `~/.config/discord-qt/config.json`, the file has the following schema:
```js
{
  "accounts": [{ // this is your auth data
    "token": "Nkj54hs...",
    "username": "Discord User",
    "discriminator": "0133",
    "avatarUrl": "https://cdn.discordapp.com/avatars/..."
  }],
  "roundifyAvatars": true, // optional, determines whether you want to roundify every user avatar
  "fastLaunch": false // optional, if true loads only first 5 guilds and first 5 DM users to launch faster
}
```

## Fonts
By default, the application uses Source Sans Pro font. However, if you want an even more seamless experience, you need to obtain a copy of Whitney fonts (commercial fonts used by Discord) and put them into `/assets/fonts` folder. In order to activate them, uncomment line with Whitley font in `/src/windows/RootWindow.scss` and rebuild.
