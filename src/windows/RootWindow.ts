import { QStackedWidget, QMainWindow, QIcon, WidgetAttribute } from "@nodegui/nodegui";
import path from "path";
import fs from "fs";
import djs, { Client, Constants } from 'discord.js';
import { app } from '..';
import { MainView } from '../views/MainView/MainView';

import { SettingsView } from "../views/SettingsView/SettingsView";
import { Account } from "../structures/Account";
import { Events } from "../structures/Events";
import { CustomStatusDialog } from '../dialogs/CustomStatusDialog';
import { AcceptInviteDialog } from '../dialogs/AcceptInviteDialog';
import { MiniProfile } from '../components/MiniProfile/MiniProfile';
import { clientOptions } from '../structures/ClientOptions';
export class RootWindow extends QMainWindow {
  private root = new QStackedWidget();
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
    this.setWindowTitle("Discord-Qt");
    this.setObjectName("RootWindow");
    this.setMinimumSize(1000, 500);
    this.resize(1200, 600);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);
    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);
    this.root.setCurrentWidget(this.mainView);
  }

  async loadStyles() {
    const stylePath = path.join(__dirname, 'themes', `${app.config.theme}.theme.css`);
    const stylesheet = await fs.promises.readFile(stylePath, "utf8");
    this.setStyleSheet(stylesheet);
  }
  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, "./assets/icon.png"));
    this.setWindowIcon(icon);
  }

  public async loadClient(account: Account): Promise<boolean> {
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
      this.setWindowTitle(`Discord-Qt • ${app.client.user?.tag}`);
      app.emit(Events.SWITCH_VIEW, 'dm');
      return true;
    } catch (e) {
      this.setWindowTitle(`Discord-Qt • Not logged in`);
      console.error('Couldn\'t log in', e);
      return false;
    }
  }
}