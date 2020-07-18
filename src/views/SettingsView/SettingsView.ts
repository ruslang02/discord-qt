import { QWidget, QStackedWidget, FlexLayout, QBoxLayout, Direction, QScrollArea, QPushButton, QIcon, QSize, QLabel, Shape, CursorShape, AlignmentFlag } from "@nodegui/nodegui";
import { DIconButton } from "../../components/DIconButton/DIconButton";
import { join } from "path";
import { SectionList } from "./SectionList";
import { MAX_QSIZE } from "../..";
import { Page } from "../../pages/Page";
import { AccountsPage } from "../../pages/AccountsPage";
import './SettingsView.scss';
import { EventEmitter } from "events";

export type Element = Page | Separator | CategoryHeader;

export class CategoryHeader extends QLabel {
  constructor(text: string) {
    super();
    this.setObjectName('CategoryHeader');
    this.setText(text);

  }
}
export class Separator extends QWidget {
  constructor() {
    super();
    this.setMinimumSize(20, 17);
    this.setMaximumSize(MAX_QSIZE, 17);
    this.setObjectName('Separator');
  }
}

export class SettingsView extends QWidget {
  private elements: Element[] = [
    new AccountsPage(),
    new Separator(),
    new CategoryHeader('User Settings'),
  ];

  private leftSpacer = new QWidget();
  private sectionList = new SectionList(this, this.elements);
  private pageContainer = new QScrollArea();
  private closeContainer = new QWidget();
  private rightSpacer = new QWidget();

  events = new EventEmitter();
  
  layout = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.setLayout(this.layout);
    this.setObjectName("SettingsView");
    this.initView();
    this.events.on('open', (pageTitle: string) => {
      const page = this.elements
        .find(page => page instanceof Page && page.title === pageTitle) as Page;
      this.pageContainer.takeWidget();
      this.pageContainer.setWidget(page);
    });
  }
  open(page: Page) {
  }
  private initView() {
    const { layout, leftSpacer, sectionList, pageContainer, closeContainer, rightSpacer } = this;

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);
    
    leftSpacer.setObjectName('LeftSpacer');

    const closeLayout = new QBoxLayout(Direction.TopToBottom);
    closeContainer.setLayout(closeLayout);
    closeLayout.setContentsMargins(0, 60, 21, 0);
    closeLayout.setSpacing(8);

    pageContainer.setFrameShape(Shape.NoFrame);
    pageContainer.setMinimumSize(460, 0);
    pageContainer.setMaximumSize(740, MAX_QSIZE)
    pageContainer.setObjectName("SettingsContainer");

    const closeBtn = new QPushButton();
    closeBtn.setObjectName('CloseButton');
    closeBtn.setFixedSize(36, 36);
    closeBtn.setCursor(CursorShape.PointingHandCursor);
    closeBtn.setIcon(new QIcon(join(__dirname, './assets/icons/close.png')));
    closeBtn.setIconSize(new QSize(18, 18));

    const closeKeybind = new QLabel();
    closeKeybind.setObjectName('CloseKeybind');
    closeKeybind.setText('ESC');
    closeKeybind.setAlignment(AlignmentFlag.AlignTop + AlignmentFlag.AlignHCenter);

    closeLayout.addWidget(closeBtn);
    closeLayout.addWidget(closeKeybind, 1);

    layout.addWidget(leftSpacer, 1);
    layout.addWidget(sectionList, 0);
    layout.addWidget(pageContainer, MAX_QSIZE);
    layout.addWidget(closeContainer, 0);
    layout.addWidget(rightSpacer, 1);
  }
}