# Discord on Qt
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
To be announced.

## Configuration
In order to run this application you **must** obtain a Discord user token [(how-to guide)](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs)

## Fonts
By default, the application doesn't use external fonts. However, if you want an even more seamless experience, you need to obtain a copy of Whitney OTF fonts (commercial fonts used by Discord) and put them into `/assets/fonts` folder.