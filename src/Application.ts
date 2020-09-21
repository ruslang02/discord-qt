/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import {
  QAction,
  QApplication, QFontDatabase, QIcon, QMenu, QSystemTrayIcon, WidgetEventTypes,
} from '@nodegui/nodegui';
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

  tray = new QSystemTrayIcon();

  trayMenu = new QMenu();

  accountsMenu = new QMenu();

  tagAction = new QAction();

  appIcon = new QIcon(join(__dirname, 'assets/icon.png'));

  constructor() {
    super();
    this.setMaxListeners(128);
    this.initTray();
    this.application.setQuitOnLastWindowClosed(false);
    (global as any).config = this.config;
  }

  public async start() {
    const { application } = this;
    await this.loadFonts();
    this.config = new Config(CONFIG_PATH);
    await this.config.load();
    this.updateAccountsMenu();
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

  private initTray() {
    const { tray, trayMenu, appIcon } = this;
    this.initTrayMenu();
    tray.setIcon(appIcon);
    tray.addEventListener('activated', () => {
      this.window.showNormal();
      this.window.activateWindow();
      this.window.raise();
    });
    tray.setContextMenu(trayMenu);
    tray.setToolTip('DiscordQt');
    tray.show();
  }

  private initTrayMenu() {
    const {
      trayMenu: menu, accountsMenu, appIcon, tagAction,
    } = this;

    tagAction.setEnabled(false);
    tagAction.setIcon(appIcon);
    menu.addAction(tagAction);

    {
      const item = new QAction(menu);
      item.setText('Switch to...');
      item.setMenu(accountsMenu);
      menu.addAction(item);
    }
    menu.addSeparator();
    {
      const item = new QAction(menu);
      item.setText('Open');
      item.addEventListener('triggered', () => {
        this.window.showNormal();
        this.window.activateWindow();
        this.window.raise();
      });
      menu.addAction(item);
    }
    {
      const item = new QAction(menu);
      item.setText('Quit');
      item.addEventListener('triggered', () => this.application.exit(0));
      menu.addAction(item);
    }
  }

  private updateAccountsMenu() {
    const { accountsMenu, config } = this;
    if (!config.accounts) return;
    accountsMenu.actions.forEach((a) => accountsMenu.removeAction(a));
    for (const account of config.accounts) {
      const item = new QAction();
      item.setText(`${account.username}#${account.discriminator}`);
      item.addEventListener('triggered', () => this.loadClient(account));
      accountsMenu.addAction(item);
    }
    const tag = this.client?.user?.tag;
    this.tagAction.setText(tag ? `Logged in as ${tag}` : 'Not logged in');
  }

  private async loadFonts() {
    if (!existsSync(FONTS_PATH)) return;
    for (const file of await readdir(FONTS_PATH)) {
      QFontDatabase.addApplicationFont(join(FONTS_PATH, file));
    }
  }

  public async loadClient(account: Account): Promise<void> {
    const { Events } = Constants;
    if (this.client) this.client.destroy();
    this.client = new Client(clientOptions);
    this.client.on(Events.ERROR, console.error);
    /* if (this.config.debug) {
      this.client.on(Events.DEBUG, console.debug);
      this.client.on(Events.RAW, console.debug);
    }
    */
    this.client.on(Events.WARN, console.warn);
    try {
      await this.client.login(account.token);
      this.emit(AppEvents.SWITCH_VIEW, 'dm');
      this.updateAccountsMenu();
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
