import { RootWindow } from "./windows/RootWindow";
import { Client } from "discord.js";
import path, { join } from 'path';
import fs, { existsSync } from 'fs';
import { EventEmitter } from "events";
import {QFontDatabase} from '@nodegui/nodegui';
import envPaths from 'env-paths';
import { writeFile, mkdir, readFile } from 'fs/promises';

const FONTS_PATH = path.join(__dirname, './assets/fonts');
const paths = envPaths('discord', {suffix: 'qt'})
const CONFIG_PATH = path.join(paths.config, 'config.json');

export type Account = {
  username: string,
  discriminator: string,
  token: string,
  avatar: string,
  autoLogin: boolean;
};

export type Config = {
  accounts: Account[],
  roundifyAvatars: boolean;
  fastLaunch: boolean;
  debug: boolean;
  processMarkDown: boolean;
  enableAvatars: boolean;
}

class Application extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(128);
  }
  public async start() {
    await this.loadConfig();
    this.loadFonts();
    this.window = new RootWindow();
    this.window.show();
  }

  protected async loadConfig() {
    await mkdir(paths.config, {recursive: true});
    try {
      const {accounts, roundifyAvatars, fastLaunch, debug, enableAvatars, processMarkDown} = 
        JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
      const appConfig = {
        accounts: accounts || [],
        roundifyAvatars: roundifyAvatars ?? true,
        fastLaunch: fastLaunch ?? false,
        debug: debug ?? false,
        enableAvatars: enableAvatars ?? true,
        processMarkDown: processMarkDown ?? true
      };
      console.log('Loaded config:', appConfig);
      this.config = appConfig as Config;
    } catch(err) {
      if (!existsSync(CONFIG_PATH))
        await writeFile(CONFIG_PATH, '{}', 'utf8');
      else console.error('Config file could not be used, returning to default values...');
      this.config = {
        accounts: [],
        roundifyAvatars: true,
        fastLaunch: false,
        debug: false,
        enableAvatars: true,
        processMarkDown: true,
      };
    }
    this.emit('config', this.config);
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
  async saveConfig() {
    try {
      await writeFile(join(paths.config, 'config.json'), JSON.stringify(this.config))
    } catch(e) {
      console.error(e);
    }
  }
}
export const app = new Application();
export const MAX_QSIZE = 16777215;
app.start();