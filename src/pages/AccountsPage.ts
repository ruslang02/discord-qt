import { QWidget, QBoxLayout, Direction, QLabel } from "@nodegui/nodegui";
import { Page } from "./Page";

export class AccountsPage extends Page {
  title = "Accounts";
  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.initPage();
  }

  private initPage() {
    const header = new QLabel();
    header.setObjectName('Header2');
    header.setText('Accounts');
    this.layout.addWidget(header);
  }
}