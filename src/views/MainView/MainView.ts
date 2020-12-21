import { Direction, QBoxLayout, QWidget } from '@nodegui/nodegui';
import { app } from '../..';
import { GuildsList } from '../../components/GuildsList/GuildsList';
import { LeftPanel } from '../../components/LeftPanel/LeftPanel';
import { MainPanel } from '../../components/MainPanel/MainPanel';
import { MainTitleBar } from '../../components/MainTitleBar/MainTitleBar';
import { Events } from '../../utilities/Events';

export class MainView extends QWidget {
  private controls = new QBoxLayout(Direction.LeftToRight);

  private guildsList = new GuildsList();

  private leftPanel = new LeftPanel();

  private main = new QWidget();

  private mainLayout = new QBoxLayout(Direction.TopToBottom);

  private titlebar = new MainTitleBar();

  private mainPanel = new MainPanel();

  constructor() {
    super();
    this.setObjectName('MainView');
    this.setLayout(this.controls);
    this.controls.setSpacing(0);
    this.controls.setContentsMargins(0, 0, 0, 0);
    this.mainLayout.setSpacing(0);
    this.mainLayout.setContentsMargins(0, 0, 0, 0);
    this.main.setLayout(this.mainLayout);
    this.main.setMinimumSize(0, 0);

    this.initView();

    this.leftPanel.raise();
    this.guildsList.raise();

    app.on(Events.TOGGLE_DRAWER, (value) => {
      if (!app.config.get('isMobile')) {
        return;
      }

      if (value) {
        this.guildsList.show();
        this.leftPanel.show();
      } else {
        this.guildsList.hide();
        this.leftPanel.hide();
      }
    })
  }

  private initView() {
    this.mainLayout.addWidget(this.titlebar);
    this.mainLayout.addWidget(this.mainPanel, 1);
    [this.guildsList, this.leftPanel].forEach((w) => this.controls.addWidget(w));
    this.controls.addWidget(this.main, 1);
  }
}
