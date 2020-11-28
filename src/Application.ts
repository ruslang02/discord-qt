/* eslint-disable class-methods-use-this */
import { QApplication, QFontDatabase, QIcon } from '@nodegui/nodegui';
import { Client, Snowflake } from 'discord.js';
import { existsSync, promises } from 'fs';
import i18n from 'i18n';
import { join } from 'path';
import { ApplicationEventEmitter } from './ApplicationEventEmitter';
import { Tray } from './Tray';
import { ClientManager } from './utilities/ClientManager';
import { ConfigManager } from './utilities/ConfigManager';
import { createLogger } from './utilities/Console';
import { Events as AppEvents } from './utilities/Events';
import { paths } from './utilities/Paths';
import { PluginManager } from './utilities/PluginManager';
import { MainWindow } from './windows/MainWindow/MainWindow';
import { OverlayWindow } from './windows/OverlayWindow/OverlayWindow';

const { readdir } = promises;

const FONTS_PATH = join(__dirname, './assets/fonts');
const CONFIG_PATH = join(paths.config, 'config.json');

const { log } = createLogger('Application');

/**
 * Application instance manager.
 */
export class Application extends ApplicationEventEmitter {
  readonly name = 'DiscordQt';

  currentGuildId?: Snowflake;

  clientManager = new ClientManager();

  pluginManager = new PluginManager();

  config = new ConfigManager(CONFIG_PATH);

  application = QApplication.instance();

  clipboard = QApplication.clipboard();

  iconPath = join(__dirname, 'assets/icon.png');

  icon = new QIcon(this.iconPath);

  tray?: Tray;

  constructor() {
    super();
    this.setMaxListeners(128);
    this.application.setQuitOnLastWindowClosed(false);
    this.on(AppEvents.SWITCH_VIEW, (view, options) => {
      switch (view) {
        case 'dm':
          this.currentGuildId = undefined;
          break;

        case 'guild':
          this.currentGuildId = options?.channel?.guild.id || options?.guild?.id;
          break;

        default:
      }
    });

    (global as any).config = this.config;
  }

  public async start() {
    this.tray = new Tray();

    await this.loadFonts();
    await this.config.load();

    i18n.setLocale(this.config.get('locale') || 'en-US');

    this.window = new MainWindow();
    this.window.show();

    // this.overlay = new OverlayWindow();

    void this.pluginManager.reload();

    this.emit(AppEvents.READY);
  }

  public quit() {
    log('Bye.');
    this.tray?.hide();

    if (this.client) {
      this.client.destroy();
    }

    this.application.quit();
  }

  private async loadFonts() {
    if (!existsSync(FONTS_PATH)) {
      return;
    }

    for (const file of await readdir(FONTS_PATH)) {
      QFontDatabase.addApplicationFont(join(FONTS_PATH, file));
    }
  }

  public get window(): MainWindow {
    return (global as any).win;
  }

  public set window(v: MainWindow) {
    (global as any).win = v;
  }

  public get overlay(): OverlayWindow {
    return (global as any).overlay;
  }

  public set overlay(v: OverlayWindow) {
    (global as any).overlay = v;
  }

  public get client(): Client {
    return this.clientManager.client as Client;
  }

  public get plugins() {
    return this.pluginManager.plugins;
  }
}
