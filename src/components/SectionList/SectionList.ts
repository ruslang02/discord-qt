import { QScrollArea, QWidget, QBoxLayout, Direction } from "@nodegui/nodegui";

export class SectionList extends QScrollArea {
  private root = new QWidget();
  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.setObjectName('SectionList');
  }
}