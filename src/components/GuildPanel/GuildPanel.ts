import { QWidget, FlexLayout, QBoxLayout, Direction } from "@nodegui/nodegui";
import './GuildPanel.scss';

export class GuildPanel extends QWidget {
  private titleBar = new QWidget();
  private actionsMenu = new QWidget();
  private channelsList = new QWidget();
  private controls = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();

    this.initComponent();
  }

  private initComponent() {
    const { titleBar, actionsMenu, channelsList, controls } = this;
    this.setLayout(controls);
    this.setObjectName('GuildPanel');
    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);

    [titleBar, actionsMenu]
      .forEach(w => controls.addWidget(w));
    controls.addWidget(channelsList, 1);
  }
}