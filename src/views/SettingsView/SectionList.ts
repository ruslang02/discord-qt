import { QScrollArea, QWidget, QBoxLayout, Direction, Shape, QPushButton, CursorShape } from "@nodegui/nodegui";
import { MAX_QSIZE } from "../..";
import { Element, Separator, SettingsView } from "./SettingsView";
import { Page } from "../../pages/Page";


export class SectionList extends QScrollArea {
  private root = new QWidget();
  layout = new QBoxLayout(Direction.TopToBottom);

  constructor(
    private parent: SettingsView, 
    private elements: Element[]
  ) {
    super();
    this.setObjectName('SectionList');
    this.setFrameShape(Shape.NoFrame);
    this.setMinimumSize(218, 0);
    this.setMaximumSize(218, MAX_QSIZE);
    this.setLayout(this.layout);
    this.initComponent();
    this.initPages();
  }

  private initComponent() {
    const { root, layout } = this;
    layout.setContentsMargins(20, 60, 15, 60);
    layout.setSpacing(0);
  }

  private initPages() {
    const { root, layout } = this;
    for (const elem of this.elements) {
      if(elem instanceof Page) {
        const btn = new QPushButton();
        btn.setText(elem.title);
        btn.setObjectName('PageButton');
        btn.setCursor(CursorShape.PointingHandCursor);
        btn.addEventListener('clicked', () => this.parent.events.emit('open', elem.title));
        layout.addWidget(btn);
      } else layout.addWidget(elem)
    }
  }
}