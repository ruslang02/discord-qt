import { QMainWindow } from "@nodegui/nodegui";
import { RootWindow } from "./windows/RootWindow/RootWindow";
import { Client } from "discord.js";
import path from 'path';
import fs from 'fs';

type Config = {
  token?: string;
}

export class Application {
  public static start(): void {
    this.loadConfig();
    
    let window = new RootWindow();
    window.show();

    this.GlobalWindow = window;
  }

  protected static async loadConfig() {
    const configPath = path.join(process.env.HOME || '', '.config', 'discord-qt', 'config.json');
    console.log(configPath);
    try {
      const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const appConfig = {
        token: configFile.token || undefined
      };
      console.log(appConfig);
      Application.Config = appConfig as Config;
    } catch(err) {
      console.error(err);
      Application.Config = {};
    }
  }

  public static get GlobalWindow(): QMainWindow {
    return (global as any).win;
  }
  public static set GlobalWindow(v: QMainWindow) {
    (global as any).win = v;
  }

  public static get Client(): Client {
    return (global as any).client;
  }
  public static set Client(v: Client) {
    (global as any).client = v;
  }

  public static get Config(): Config {
    return (global as any).config;
  }
  public static set Config(v: Config) {
    (global as any).config = v;
  }
}

Application.start();