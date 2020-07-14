import { QWidget, FlexLayout } from "@nodegui/nodegui";

export class GuildView extends QWidget {
  private guildPanel = new QWidget();
  private channelView = new QWidget();
  private membersPanel = new QWidget();

  constructor() {
    super();
    this.initView();
  }

  initView() {
    this.setLayout(new FlexLayout());
    this.setObjectName("GuildView");
    [this.guildPanel, this.channelView,this.membersPanel].forEach(v => this.layout?.addWidget(v));
  }
}