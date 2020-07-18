import { QScrollArea, QWidget, QBoxLayout, Direction, Shape, QPushButton, CursorShape } from "@nodegui/nodegui";
import { MAX_QSIZE, app } from "../..";
import { Element, Separator, SettingsView } from "./SettingsView";
import { Page } from "../../pages/Page";


export class SectionList extends QScrollArea {
  private root = new QWidget();
  private pageButtons = new Map<Page, QPushButton>();
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

    app.on('openSettingsPage', (pageTitle: string) => {
      this.pageButtons.forEach((button, page) => {
        const prev = button.property('active').toBool();
        button.setProperty('active', page.title === pageTitle);
        if(prev != (page.title === pageTitle)) button.repolish();
      });
    });
  }

  private initComponent() {
    const { root, layout } = this;
    layout.setContentsMargins(20, 60, 15, 60);
    layout.setSpacing(0);
  }

  private initPages() {
    const { root, layout, pageButtons } = this;
    for (const elem of this.elements) {
      if(elem instanceof Page) {
        const btn = new QPushButton();
        btn.setText(elem.title);
        btn.setObjectName('PageButton');
        btn.setCursor(CursorShape.PointingHandCursor);
        btn.addEventListener('clicked', () => app.emit('openSettingsPage', elem.title));
        layout.addWidget(btn);
        pageButtons.set(elem, btn);
      } else layout.addWidget(elem)
    }
    layout.addStretch(1);
  }
}