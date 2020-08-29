import { QStackedWidget, QMainWindow, QIcon, WidgetAttribute } from "@nodegui/nodegui";
import path from "path";
import { Client, Constants } from 'discord.js';
import { existsSync, promises } from "fs";
const { readFile } = promises;

import { app } from '..';
import { MiniProfile } from '../components/MiniProfile/MiniProfile';
import { CustomStatusDialog } from '../dialogs/CustomStatusDialog';
import { AcceptInviteDialog } from '../dialogs/AcceptInviteDialog';
import { Account } from "../structures/Account";
import { Events } from "../structures/Events";
import { clientOptions } from '../structures/ClientOptions';
import { MainView } from '../views/MainView/MainView';
import { SettingsView } from "../views/SettingsView/SettingsView";

export class RootWindow extends QMainWindow {
  private root = new QStackedWidget(this);
  dialogs = {
    customStatus: new CustomStatusDialog(this),
    acceptInvite: new AcceptInviteDialog(this),
    miniProfile: new MiniProfile(this),
  };
  private mainView = new MainView();
  private settingsView = new SettingsView();

  constructor() {
    super();
    this.loadStyles();
    this.loadIcon();
    this.initializeWindow();

    app.on(Events.SWITCH_VIEW, (view: string) => {
      switch (view) {
        case 'main':
          this.root.setCurrentWidget(this.mainView);
          break;
        case 'settings':
          this.root.setCurrentWidget(this.settingsView);
          break;
      }
    });

    app.on(Events.READY, () => {
      const autoAccount = app.config.accounts?.find(a => a.autoLogin);
      if (autoAccount) this.loadClient(autoAccount);
      this.loadStyles();
    })
  }

  protected initializeWindow() {
    this.setWindowTitle("DiscordQt");
    this.setObjectName("RootWindow");
    this.setMinimumSize(1000, 500);
    this.resize(1200, 600);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);
    Object.values(this.dialogs).forEach(w => w.hide());
    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);
    this.root.setCurrentWidget(this.mainView);
  }

  async loadStyles() {
    const stylePath = path.join(__dirname, 'themes', `${app.config.theme}.theme.css`);
    if (!existsSync(stylePath)) return;
    const stylesheet = await readFile(stylePath, "utf8");
    this.setStyleSheet(stylesheet);
  }
  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, "./assets/icon.png"));
    this.setWindowIcon(icon);
  }

  public async loadClient(account: Account): Promise<void> {
    const { Events: DiscordEvents } = Constants;
    if (app.client) await app.client.destroy();
    app.client = new Client(clientOptions);
    app.client.on(DiscordEvents.ERROR, console.error)
    if (app.config.debug) {
      app.client.on(DiscordEvents.DEBUG, console.debug);
      app.client.on(DiscordEvents.RAW, console.debug);
    }
    app.client.on(DiscordEvents.WARN, console.warn);
    try {
      await app.client.login(account.token);
      app.emit(Events.SWITCH_VIEW, 'dm');
    } catch (e) {
      console.error('Couldn\'t log in', e);
    }
  }
}