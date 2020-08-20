import { QWidget, QBoxLayout, Direction, QScrollArea, QPushButton, QIcon, QSize, QLabel, Shape, CursorShape, AlignmentFlag, TextInteractionFlag, QGraphicsDropShadowEffect } from "@nodegui/nodegui";
import { join } from "path";
import { SectionList } from "./SectionList";
import { MAX_QSIZE, app } from "../..";
import { Page } from "./pages/Page";
import { AccountsPage } from "./pages/AccountsPage";

import { MyAccountPage } from './pages/MyAccountPage';
import { DIconButton } from '../../components/DIconButton/DIconButton';
import open from 'open';
import { AppearancePage } from './pages/AppearancePage';
import { Events } from "../../structures/Events";

export type Element = Page | Divider | CategoryHeader | Footer;

export class Footer extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);
  constructor() {
    super();

    this.setLayout(this.layout);
    this.initComponent();
  }

  private async initComponent() {
    const github = new DIconButton({
      iconPath: join(__dirname, './assets/icons/github.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'GitHub'
    });
    github.setFixedSize(24, 24);
    const label = new QLabel();
    const me = await import('../../../package.json') as { version: string, repository: {url: string} };
    github.addEventListener('clicked', () => open(me.repository.url));
    // @ts-ignore
    label.setText(`DiscordQt ${me.version}${__BUILDNUM__ !== 0 ? ` (build ${__BUILDNUM__})` : ''}<br>node ${process.versions.node}<br>qode ${process.versions.qode}<br>${process.platform} ${process.arch}`);
    label.setOpenExternalLinks(true);
    label.setObjectName('Footer');
    label.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    label.setCursor(CursorShape.IBeamCursor);
    this.layout.addWidget(github);
    this.layout.addWidget(label, 1);
  }
}

export class CategoryHeader extends QLabel {
  constructor(text: string) {
    super();
    this.setObjectName('CategoryHeader');
    this.setText(text);
  }
}
export class Divider extends QWidget {
  constructor() {
    super();
    this.setMinimumSize(20, 17);
    this.setMaximumSize(MAX_QSIZE, 17);
    this.setObjectName('Divider');
  }
}

export class SettingsView extends QWidget {
  private elements: Element[] = [
    new AccountsPage(),
    new Divider(),
    new CategoryHeader('User Settings'),
    new MyAccountPage(),
    new Divider(),
    new CategoryHeader('App Settings'),
    new AppearancePage(),
    new Divider(),
    new Footer(),
  ];

  private leftSpacer = new QWidget();
  private sectionList = new SectionList(this, this.elements);
  private pageContainer = new QScrollArea();
  private closeContainer = new QWidget();
  private rightSpacer = new QWidget();
  
  layout = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.setLayout(this.layout);
    this.setObjectName("SettingsView");
    this.initView();
    this.setEvents();
  }
  private setEvents() {
    app.on(Events.OPEN_SETTINGS_PAGE, (pageTitle: string) => {
      const { pageContainer, elements } = this;
      const page = elements.find(page => page instanceof Page && page.title === pageTitle) as Page;
      
      pageContainer.takeWidget();
      pageContainer.setWidget(page);
    });
  }
  private initView() {
    const { layout, leftSpacer, sectionList, pageContainer, closeContainer, rightSpacer } = this;

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);
    
    leftSpacer.setObjectName('LeftSpacer');

    const closeLayout = new QBoxLayout(Direction.TopToBottom);
    closeContainer.setLayout(closeLayout);
    closeLayout.setContentsMargins(0, 60, 21, 0);
    closeLayout.setSpacing(0);

    pageContainer.setFrameShape(Shape.NoFrame);
    pageContainer.setMinimumSize(460, 0);
    pageContainer.setMaximumSize(740, MAX_QSIZE)
    pageContainer.setObjectName("SettingsContainer");
    pageContainer.setWidget(this.elements[0] as Page);

    const effect = new QGraphicsDropShadowEffect();
    effect.setBlurRadius(5);
    effect.setXOffset(0);
    effect.setYOffset(0);
    
    const closeBtn = new QPushButton();
    closeBtn.setObjectName('CloseButton');
    closeBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'main'));
    closeBtn.setFixedSize(36, 36);
    closeBtn.setCursor(CursorShape.PointingHandCursor);
    closeBtn.setIcon(new QIcon(join(__dirname, './assets/icons/close.png')));
    closeBtn.setIconSize(new QSize(18, 18));
    closeBtn.setGraphicsEffect(effect);

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