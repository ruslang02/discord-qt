import { QWidget, FlexLayout, QStackedWidget, QLabel } from "@nodegui/nodegui";
import { UserPanel } from "../UserPanel/UserPanel";
import './LeftPanel.scss';
import { GuildPanel } from "../GuildPanel/GuildPanel";
import { DMPanel } from "../DMPanel/DMPanel";

export class LeftPanel extends QWidget {
  private container = new QStackedWidget();
  private guildPanel = new GuildPanel();
  private dmPanel = new DMPanel();
  private userPanel = new UserPanel();

  constructor() {
    super();
    this.initLeftPanel();
  }
  private initLeftPanel() {
    const { guildPanel, dmPanel, userPanel, container } = this;
    this.setLayout(new FlexLayout());
    this.setObjectName('LeftPanel');
    container.addWidget(guildPanel);
    container.addWidget(dmPanel);
    container.setCurrentWidget(dmPanel);
    container.setObjectName('Container');
    const label = new QLabel();
    label.setText("heloo");
    [container, userPanel]
      .forEach(w => this.layout?.addWidget(w));
  }
}