import { QWidget, QStackedWidget, QMainWindow, QIcon, WidgetAttribute } from "@nodegui/nodegui";
import path from "path";
import fs from "fs";
import { app } from '../..';
import { Client } from 'discord.js';
import { MainView } from '../../views/MainView/MainView';
import './RootWindow.scss';

export class RootWindow extends QMainWindow {
  private root = new QStackedWidget();

  private mainView = new MainView();
  private settingsView = new QWidget();

  constructor() {
    super();

    this.loadIcon();
    this.loadStyles();
    this.initializeWindow();
    this.loadClient();
  }

  protected initializeWindow() {
    this.setWindowTitle("Discord-Qt");
    this.setObjectName("RootWindow");
    this.setMinimumSize(800, 400);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);
    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);
    this.root.setCurrentWidget(this.mainView);
  }

  protected async loadStyles() {
    const stylesheet = await fs.promises.readFile(path.resolve(__dirname, "index.css"), "utf8");
    this.setStyleSheet(stylesheet);
  }
  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, "../assets/icons/logo.png"));
    this.setWindowIcon(icon);
  }

  public async loadClient(): Promise<boolean> {
    app.client = new Client();
    app.client.on('error', console.error)
    app.client.on('debug', console.debug)
    app.client.on('warn', console.warn)
    try {
      await app.client.login(app.config.token || 's');
      this.setWindowTitle(`Discord-Qt • ${app.client.user.username}#${app.client.user.discriminator}`);
      return true;
    } catch(e) {
      console.log(e);
      this.setWindowTitle(`Discord-Qt • Not logged in`);
      return false;
    }
  }
}