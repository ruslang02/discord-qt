import { QWidget, QBoxLayout, Direction, QLabel } from "@nodegui/nodegui";
import { Page } from "./Page";

export class AccountsPage extends Page {
  title = "Accounts";

  constructor() {
    super();
    this.initPage();
  }

  private initPage() {
    const { layout } = this;
    const header = new QLabel();
    header.setObjectName('Header2');
    header.setText('Accounts');
    layout.addWidget(header);
  }
}