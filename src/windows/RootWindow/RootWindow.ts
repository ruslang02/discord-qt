import './RootWindow.scss';
import { QWidget, FlexLayout, QStackedWidget, QMainWindow, QIcon } from "@nodegui/nodegui";
import path from "path";
import fs from "fs";
import { app } from '../..';
import { GuildsList } from '../../components/GuildsList/GuildsList';
import { Client } from 'discord.js';
import { MainView } from '../../views/MainView/MainView';
import { LeftPanel } from '../../components/LeftPanel/LeftPanel';

export class RootWindow extends QMainWindow {
  private root: QStackedWidget = new QStackedWidget();

  private mainView: QWidget = new QWidget();
  private settingsView: QWidget = new QWidget();

  private guildsList: GuildsList = new GuildsList();
  private leftPanel = new LeftPanel();
  private container = new MainView();

  constructor() {
    super();

    this.loadIcon();
    this.loadStyles();
    this.initializeWindow();
    this.loadClient().then();
    this.loadControls();
  }

  protected initializeWindow() {
    this.setWindowTitle("Discord-Qt");
    this.mainView.setLayout(new FlexLayout());
    this.mainView.setObjectName("Root");
    this.setObjectName("RootWindow");
    this.setMinimumSize(400, 400);
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
    const icon = new QIcon(path.resolve(__dirname, "../assets/images/logo.png"));
    this.setWindowIcon(icon);
  }

  protected loadControls() {
    [this.guildsList, this.leftPanel, this.container]
      .forEach(w => this.mainView.layout?.addWidget(w));
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