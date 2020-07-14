import { QWidget, QStackedWidget, FlexLayout } from "@nodegui/nodegui";

export class SettingsView extends QWidget {
  private sectionsPanel = new QWidget();
  private mainPanel = new QStackedWidget();

  constructor() {
    super();
    this.initView();
  }
  initView() {
    this.setLayout(new FlexLayout());
    this.setObjectName("GuildView");
    [this.sectionsPanel, this.mainPanel].forEach(v => this.layout?.addWidget(v));
  }
}