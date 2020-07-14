import { QWidget, FlexLayout } from "@nodegui/nodegui";

export class DMView extends QWidget {
  private guildPanel = new QWidget();
  private channelView = new QWidget();
  private membersPanel = new QWidget();

  constructor() {
    super();
    this.initView();
  }

  initView() {
    this.setLayout(new FlexLayout());
    this.setObjectName("DMView");
    [this.guildPanel, this.channelView, this.membersPanel]
      .forEach(w => this.layout?.addWidget(w));
  }
}