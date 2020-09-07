import { EventEmitter } from "events";
import { existsSync, promises } from 'fs';
import i18n from 'i18n';
import { join } from 'path';
import { QFontDatabase, WidgetEventTypes, QApplication } from '@nodegui/nodegui';

const { readdir } = promises;
import envPaths from 'env-paths';
export const paths = envPaths('discord', { suffix: 'qt' });

import { Patches } from './patches';
console.log(`[dqt] Applied ${Patches.length} patches.`);

i18n.configure({
  directory: join(__dirname, 'locales'),
  locales: ['en-US', 'ru-RU'],
  defaultLocale: "ru-RU",
 
  // setting of log level DEBUG - default to require('debug')('i18n:debug')
  logDebugFn: function (msg) {},
 
  // setting of log level WARN - default to require('debug')('i18n:warn')
  logWarnFn: function (msg) {},
 
  // setting of log level ERROR - default to require('debug')('i18n:error')
  logErrorFn: function (msg) {
    console.log('error', msg)
  },

  // used to alter the behaviour of missing keys
  missingKeyFn: function (locale, value) {
    console.error(`Translation missing for word "${value}" in locale "${locale}".`);
    return value;
  },
});

import { Client } from 'discord.js';
import { RootWindow } from "./windows/RootWindow";
import { Config } from "./structures/Config";
import { Events } from "./structures/Events";

const FONTS_PATH = join(__dirname, './assets/fonts');
const CONFIG_PATH = join(paths.config, 'config.json');


class Application extends EventEmitter {
  config = new Config(CONFIG_PATH);
  application = QApplication.instance();

  constructor() {
    super();
    this.setMaxListeners(128);
    (global as any).config = this.config;
  }

  public async start() {
    const { application, config } = this;
    application.setQuitOnLastWindowClosed(false);
    await this.loadFonts();
    this.window = new RootWindow();
    this.window.show();
    this.window.addEventListener(WidgetEventTypes.Close, async () => {
      console.log('Bye.');
      if (app.client) {
        await app.client.destroy();
      }
      application.quit();
    })
    await config.load();
    this.emit(Events.READY);
  }

  private async loadFonts() {
    if (!existsSync(FONTS_PATH)) return;
    for (const file of await readdir(FONTS_PATH))
      QFontDatabase.addApplicationFont(join(FONTS_PATH, file))
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
    this.emit(Events.NEW_CLIENT, v);
  }
}
export const app = new Application();
export const MAX_QSIZE = 16777215;
app.start();