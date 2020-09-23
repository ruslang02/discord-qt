# DiscordQt
[![npm](https://img.shields.io/npm/v/discord-qt)](https://www.npmjs.com/package/discord-qt)
![DiscordQt CI](https://github.com/ruslang02/discord-qt/workflows/DiscordQt%20CI/badge.svg)
![David](https://img.shields.io/david/ruslang02/discord-qt)

A Discord desktop client powered by Node.JS and [NodeGui](https://github.com/nodegui).
It offers a significantly less resource-consuming experience comparing to the official Electron-based desktop client thanks to native UI rendering instead of a Chromium rendering engine.

![Screenshot](screenshot.png)

Node.JS v12+ is required to build.

## Running the binary release
Precompiled builds are available at https://github.com/ruslang02/discord-qt/releases for Windows, macOS and Linux (AppImage, Debian package).

## Installing from npm
Windows (macOS should work as well, however not tested):
```bash
npm i -g discord-qt
```

Linux:
```
# npm i -g discord-qt --unsafe-perm --allow-root
```

## Installing from sources
```bash
git clone https://github.com/ruslang02/discord-qt
cd discord-qt/
npm install
npm start
```

## Configuration
In order to run this application you **must** obtain a Discord user token [(how-to guide)](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs).
You can configure your user accounts, as well as other settings in the Settings screen.

## Fonts
By default, the application uses Source Sans Pro font. However, if you want an even more seamless experience, you need to obtain a copy of Whitney fonts (commercial fonts used by Discord) and put them into `/assets/fonts` folder. In order to activate them, uncomment line with Whitley font in `/src/windows/RootWindow.scss` and rebuild.

## Caution
DiscordQt is against Discord's Terms of Service as an unofficial client, *however* you most likely won't get banned/detected for using this client. 

## License
GPL 3.0

## Third-party
 - [NodeGui](https://github.com/nodegui/nodegui)
 - [discord.js](https://github.com/discordjs/discord.js)
 - [Qt](https://www.qt.io/)
 - [Material Design Icons](https://github.com/Templarian/MaterialDesign)
 - [markdown-it](https://github.com/markdown-it/markdown-it)
 - [Packer](https://github.com/nodegui/packer)
 - [Source Sans Pro fonts](https://github.com/adobe-fonts/source-sans-pro)
