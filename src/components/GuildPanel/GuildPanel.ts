import { QWidget, FlexLayout } from "@nodegui/nodegui";
import './GuildPanel.scss';

export class GuildPanel extends QWidget {
  private titleBar = new QWidget();
  private actionsMenu = new QWidget();
  private channelsList = new QWidget();
  constructor() {
    super();

    this.initComponent();
  }

  private initComponent() {
    this.setLayout(new FlexLayout());
    this.setObjectName('GuildPanel');

    const { titleBar, actionsMenu, channelsList, layout } = this;
    [titleBar, actionsMenu, channelsList]
      .forEach(w => layout?.addWidget(w));
  }
}