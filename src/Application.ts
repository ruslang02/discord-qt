/* eslint-disable class-methods-use-this */
import {
  QApplication, QFontDatabase, QIcon,
} from '@nodegui/nodegui';
import { Client, Constants, HTTPError } from 'discord.js';
import { existsSync, promises } from 'fs';
import i18n, { __ } from 'i18n';
import { notify } from 'node-notifier';
import { join } from 'path';
import { app } from '.';
import { ApplicationEventEmitter } from './ApplicationEventEmitter';
import { Account } from './structures/Account';
import { clientOptions } from './structures/ClientOptions';
import { Config } from './structures/Config';
import { Events as AppEvents } from './structures/Events';
import { paths } from './structures/Paths';
import { Tray } from './Tray';
import { createLogger } from './utilities/Console';
import { RootWindow } from './windows/RootWindow';

const { readdir } = promises;

const FONTS_PATH = join(__dirname, './assets/fonts');
const CONFIG_PATH = join(paths.config, 'config.json');

const {
  log, debug, warn, error,
} = createLogger('Application');

/**
 * Application instance manager.
 */
export class Application extends ApplicationEventEmitter {
  config = new Config(CONFIG_PATH);

  application = QApplication.instance();

  clipboard = QApplication.clipboard();

  iconPath = join(__dirname, 'assets/icon.png');

  icon = new QIcon(this.iconPath);

  readonly name = 'DiscordQt';

  tray?: Tray;

  constructor() {
    super();
    this.setMaxListeners(128);
    this.application.setQuitOnLastWindowClosed(false);
    (global as any).config = this.config;
  }

  public async start() {
    this.tray = new Tray();
    await this.loadFonts();
    this.config = new Config(CONFIG_PATH);
    await this.config.load();
    i18n.setLocale(this.config.locale as string);
    this.window = new RootWindow();
    this.window.show();
    this.emit(AppEvents.READY);
  }

  public quit() {
    log('Bye.');
    this.tray?.hide();
    if (this.client) this.client.destroy();
    this.application.quit();
  }

  private async loadFonts() {
    if (!existsSync(FONTS_PATH)) return;
    for (const file of await readdir(FONTS_PATH)) {
      QFontDatabase.addApplicationFont(join(FONTS_PATH, file));
    }
  }

  /**
   * Initiates discord.js connection.
   * @param account Account to connect.
   */
  public async loadClient(account: Account): Promise<void> {
    const { Events } = Constants;
    if (this.client) this.client.destroy();
    this.client = new Client(clientOptions);
    this.client.on(Events.ERROR, error);
    if (this.config.debug) {
      this.client.on(Events.DEBUG, debug);
      this.client.on(Events.RAW, debug);
    }
    this.client.on(Events.WARN, warn);
    try {
      await this.client.login(account.token);
      this.emit(AppEvents.SWITCH_VIEW, 'dm');
    } catch (e) {
      if (e instanceof HTTPError) {
        this.emit(AppEvents.LOGIN_FAILED);
        notify({
          title: __('NETWORK_ERROR_REST_REQUEST'),
          message: __('NETWORK_ERROR_CONNECTION'),
          // @ts-ignore
          type: 'error',
          icon: this.iconPath,
          category: 'im',
          hint: 'string:desktop-entry:discord-qt',
          'app-name': app.name,
        });
      }
      debug('Couldn\'t log in', e);
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
