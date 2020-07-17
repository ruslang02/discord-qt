import { RootWindow } from "./windows/RootWindow";
import { Client } from "discord.js";
import path from 'path';
import fs from 'fs';
import { EventEmitter } from "events";
import {QFontDatabase} from '@nodegui/nodegui';

const FONTS_PATH = path.join(__dirname, '../assets/fonts');

type Config = {
  token?: string;
  roundifyAvatars: boolean;
  fastLaunch: boolean;
}

class Application extends EventEmitter {
  public async start() {
    await this.loadConfig();
    this.loadFonts();
    this.window = new RootWindow();
    this.window.show();
  }

  protected async loadConfig() {
    const configPath = path.join(process.env.HOME || '', '.config', 'discord-qt', 'config.json');
    console.log(configPath);
    try {
      const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const appConfig = {
        token: configFile.token || undefined,
        roundifyAvatars: configFile.roundifyAvatars ?? true,
        fastLaunch: configFile.fastLaunch ?? false,
      };
      console.log(appConfig);
      this.config = appConfig as Config;
    } catch(err) {
      console.error(err);
      this.config = {
        roundifyAvatars: true,
        fastLaunch: false,
      };
    }
  }

  private loadFonts() {
    if (!fs.existsSync(FONTS_PATH)) return;
    for (const file of fs.readdirSync(FONTS_PATH))
      QFontDatabase.addApplicationFont(path.join(FONTS_PATH, file))
  }

  public get window(): RootWindow {
    return (global as any).win;
  }
  public set window(v: RootWindow) {
    (global as any).win = v;
  }

  public get client(): Client {
    return (global as any).client;
  }
  public set client(v: Client) {
    (global as any).client = v;
    this.emit('client', v);
  }

  public get config(): Config {
    return (global as any).config;
  }
  public set config(v: Config) {
    (global as any).config = v;
  }
}
export const app = new Application();
export const MAX_QSIZE = 16777215;
app.start();