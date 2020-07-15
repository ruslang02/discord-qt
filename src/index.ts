import { RootWindow } from "./windows/RootWindow/RootWindow";
import { Client } from "discord.js";
import path from 'path';
import fs from 'fs';
import { EventEmitter } from "events";

type Config = {
  token?: string;
  roundifyAvatars: boolean;
  fastLaunch: boolean;
}

class Application extends EventEmitter {
  public async start() {
    await this.loadConfig();
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
app.start();