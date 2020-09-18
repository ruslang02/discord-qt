import { QApplication, QFontDatabase, WidgetEventTypes } from '@nodegui/nodegui';
import { Client } from 'discord.js';
import { existsSync, promises } from 'fs';
import i18n from 'i18n';
import { join } from 'path';
import { paths } from '.';
import { ApplicationEventEmitter } from './ApplicationEventEmitter';
import { Config } from './structures/Config';
import { Events } from './structures/Events';
import { RootWindow } from './windows/RootWindow';
const { readdir } = promises;

const FONTS_PATH = join(__dirname, './assets/fonts');
const CONFIG_PATH = join(paths.config, 'config.json');
export class Application extends ApplicationEventEmitter {
  config = new Config(CONFIG_PATH);
  application = QApplication.instance();

  constructor() {
    super();
    this.setMaxListeners(128);
    this.application.setQuitOnLastWindowClosed(false);
    (global as any).config = this.config;
  }

  public async start() {
    const { application } = this;
    await this.loadFonts();
    this.config = new Config(CONFIG_PATH);
    await this.config.load();
    i18n.setLocale(this.config.locale as string);
    this.window = new RootWindow();
    this.window.show();
    this.window.addEventListener(WidgetEventTypes.Close, async () => {
      console.log('Bye.');
      if (this.client) this.client.destroy();
      application.quit();
    });
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