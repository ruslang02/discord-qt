import { RootWindow } from "./windows/RootWindow";
import { Client } from "discord.js";
import path from 'path';
import fs from 'fs';
import { EventEmitter } from "events";
import {QFontDatabase} from '@nodegui/nodegui';
import envPaths from 'env-paths';

const FONTS_PATH = path.join(__dirname, './assets/fonts');
const paths = envPaths('discord', {suffix: 'qt'})

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
    fs.mkdirSync(paths.config, {recursive: true});
    const configPath = path.join(paths.config, 'config.json');
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
      if (!fs.existsSync(configPath))
        fs.writeFileSync(configPath, '{}', 'utf8');
      else console.error('Config file could not be used, returning to default values...');
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