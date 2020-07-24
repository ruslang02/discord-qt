# DiscordQt
A Discord desktop client powered by Node.JS and [NodeGUI/Qt](https://github.com/nodegui).
It offers a significantly less resource-consuming experience comparing to the official Electron-based desktop client thanks to native UI rendering instead of a Chromium rendering engine.

![Screenshot](screenshot.png)

Node.JS v12 or newer is required.

## Installing from npm
Windows (macOS should work as well, however not tested):
```bash
npm i -g discord-qt
```

Linux:
```bash
sudo npm i -g discord-qt --unsafe-perm=true --allow-root
```

**Note** Due to some minor difficulties version 0.2.0 is versioned as 0.1.99 on the NPM registry. Otherwise, this is the same 0.2.0 release.

## Installing from sources
```bash
git clone https://github.com/ruslang02/discord-qt
cd discord-qt/
npm install
npm start
```

## Running the binary release
Precompiled builds are available at https://github.com/ruslang02/discord-qt/releases for Windows and Linux (AppImage, Debian package).

## Configuration
In order to run this application you **must** obtain a Discord user token [(how-to guide)](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs).
You can configure your user accounts, as well as other settings in the Settings screen.


There is also a config file `~/.config/discord-qt/config.json`, the file has the following schema:
```js
{
  "accounts": [{ // this is your auth data
    "token": "Nkj54hs...",
    "username": "Discord User",
    "discriminator": "0133",
    "avatarUrl": "https://cdn.discordapp.com/avatars/..."
  }],
  "processMarkdown": true, // if true process Markdown in the messages
  "enableAvatars": true, // if true loads user avatars
  "roundifyAvatars": true, // determines whether you want to roundify every user avatar
  "fastLaunch": false, // if true loads only first 5 guilds and first 5 DM users to launch faster
  "debug": false // if true outputs some debug info
}
```

## Fonts
By default, the application uses Source Sans Pro font. However, if you want an even more seamless experience, you need to obtain a copy of Whitney fonts (commercial fonts used by Discord) and put them into `/assets/fonts` folder. In order to activate them, uncomment line with Whitley font in `/src/windows/RootWindow.scss` and rebuild.

## License
GPL 3.0

## Third-party
 - [NodeGui](https://github.com/nodegui/nodegui)
 - [discord.js](https://github.com/discordjs/discord.js)
 - [Qt](https://www.qt.io/)
 - [Material Design Icons](https://github.com/Templarian/MaterialDesign)
 - [markdown-it](https://github.com/markdown-it/markdown-it)
 - [Source Sans Pro fonts](https://github.com/adobe-fonts/source-sans-pro)