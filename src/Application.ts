/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import { QApplication, QFontDatabase, WidgetEventTypes } from '@nodegui/nodegui';
import { Client, Constants } from 'discord.js';
import { existsSync, promises } from 'fs';
import i18n from 'i18n';
import { join } from 'path';
import { ApplicationEventEmitter } from './ApplicationEventEmitter';
import { Account } from './structures/Account';
import { clientOptions } from './structures/ClientOptions';
import { Config } from './structures/Config';
import { Events as AppEvents } from './structures/Events';
import { paths } from './structures/Paths';
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
    this.emit(AppEvents.READY);
  }

  private async loadFonts() {
    if (!existsSync(FONTS_PATH)) return;
    for (const file of await readdir(FONTS_PATH)) {
      QFontDatabase.addApplicationFont(join(FONTS_PATH, file));
    }
  }

  public async loadClient(account: Account): Promise<void> {
    const { Events } = Constants;
    if (this.client) await this.client.destroy();
    this.client = new Client(clientOptions);
    this.client.on(Events.ERROR, console.error);
    if (this.config.debug) {
      this.client.on(Events.DEBUG, console.debug);
      this.client.on(Events.RAW, console.debug);
    }
    this.client.on(Events.WARN, console.warn);
    try {
      await this.client.login(account.token);
      this.emit(AppEvents.SWITCH_VIEW, 'dm');
    } catch (e) {
      console.error('Couldn\'t log in', e);
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
    this.emit(AppEvents.NEW_CLIENT, v);
  }
}
