import {
  CursorShape,
  Direction,
  QBoxLayout,
  QPushButton,
  QScrollArea,
  Shape,
} from '@nodegui/nodegui';
import { __ } from '../../utilities/StringProvider';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../utilities/Events';
import { Page } from './pages/Page';
import { Element } from './SettingsView';

export class SectionList extends QScrollArea {
  private pageButtons = new Map<Page, QPushButton>();

  private active?: QPushButton;

  private elements: Element[];

  layout = new QBoxLayout(Direction.TopToBottom);

  constructor(elements: Element[]) {
    super();
    this.elements = elements;
    this.setObjectName('SectionList');
    this.setFrameShape(Shape.NoFrame);
    this.setMinimumSize(218, 0);
    this.setMaximumSize(218, MAX_QSIZE);
    this.setLayout(this.layout);
    this.initComponent();
    this.initPages();

    app.on(Events.OPEN_SETTINGS_PAGE, (pageTitle: string) => {
      this.active?.setProperty('active', false);
      this.active?.repolish();
      const page = [...this.pageButtons.keys()].find((p) => p.title === pageTitle);

      if (!page) {
        return;
      }

      this.active = this.pageButtons.get(page);
      this.active?.setProperty('active', true);
      this.active?.repolish();
    });

    app.emit(Events.OPEN_SETTINGS_PAGE, __('ACCOUNTS'));
  }

  private initComponent() {
    const { layout } = this;

    layout.setContentsMargins(20, 60, 15, 60);
    layout.setSpacing(0);
  }

  private initPages() {
    const { layout, pageButtons } = this;

    for (const elem of this.elements) {
      if (elem instanceof Page) {
        const btn = new QPushButton();

        btn.setText(elem.title);
        btn.setObjectName('PageButton');
        btn.setCursor(CursorShape.PointingHandCursor);
        btn.addEventListener('clicked', () => app.emit('openSettingsPage', elem.title));
        layout.addWidget(btn);
        pageButtons.set(elem, btn);
      } else {
        layout.addWidget(elem);
      }
    }

    layout.addStretch(1);
  }
}
