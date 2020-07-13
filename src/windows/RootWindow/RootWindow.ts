import './RootWindow.scss';
import { QWidget, FlexLayout, QStackedWidget } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import { GuildsList } from '../../components/GuildsList/GuildsList';
import { Client } from 'discord.js';
import { LoginView } from '../LoginView/LoginView';

export class RootWindow extends Window {
  private root: QStackedWidget = new QStackedWidget();

  private mainView: QWidget = new QWidget();
  private settingsView: QWidget = new QWidget();

  private guildsList: GuildsList = new GuildsList();
  private container: QStackedWidget = new QStackedWidget();

  constructor() {
    super();

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

  protected loadControls() {
    this.container.addWidget(new LoginView());
    this.mainView.layout?.addWidget(this.guildsList);
    this.mainView.layout?.addWidget(this.container);
  }

  public async loadClient(): Promise<boolean> {
    Application.Client = new Client();
    Application.Client.on('error', console.error)
    Application.Client.on('debug', console.debug)
    Application.Client.on('warn', console.warn)
    try {
      await Application.Client.login(Application.Config.token || 's');
      this.setWindowTitle(`Discord-Qt • ${Application.Client.user?.username}#${Application.Client.user?.discriminator}`);
      this.guildsList.loadVirtualGuilds();
      return true;
    } catch(e) {
      console.log(e);
      this.setWindowTitle(`Discord-Qt • Not logged in`);
      return false;
    }
  }
}