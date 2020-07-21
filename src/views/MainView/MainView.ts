import { QStackedWidget, QWidget, QBoxLayout, Direction } from "@nodegui/nodegui";
import { GuildView } from "../GuildView/GuildView";
import { DMView } from "../DMView/DMView";
import { LeftPanel } from '../../components/LeftPanel/LeftPanel';
import { GuildsList } from '../../components/GuildsList/GuildsList';
import './MainView.scss';
import { app } from '../..';
import { Guild } from 'discord.js';

export class MainView extends QWidget {
  private controls = new QBoxLayout(Direction.LeftToRight);

  private guildsList = new GuildsList();
  private leftPanel = new LeftPanel();
  private container = new QStackedWidget();

  private guildView = new GuildView();
  private dmView = new DMView();

  constructor() {
    super();
    this.setObjectName('MainView');
    this.setLayout(this.controls);
    this.controls.setSpacing(0);
    this.controls.setContentsMargins(0, 0, 0, 0);

    this.initView();
    app.on('switchView', (view: string, guild: Guild) => {
      switch(view) {
        case 'dm':
          this.container.setCurrentWidget(this.dmView);
          break;
        case 'guild':
          this.container.setCurrentWidget(this.guildView);
          break;
      }
    })
  }

  private initView() {
    [this.guildView, this.dmView]
      .forEach(w => this.container.addWidget(w));
      this.container.setCurrentWidget(this.dmView);
    [this.guildsList, this.leftPanel]
      .forEach(w => this.controls.addWidget(w));
    this.controls.addWidget(this.container, 1);
  }
}