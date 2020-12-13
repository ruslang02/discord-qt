import {
  AlignmentFlag,
  CursorShape,
  Direction,
  QBoxLayout,
  QGraphicsDropShadowEffect,
  QIcon,
  QLabel,
  QPushButton,
  QScrollArea,
  QSize,
  QStackedWidget,
  QWidget,
  ScrollBarPolicy,
  Shape,
} from '@nodegui/nodegui';
import { join } from 'path';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../utilities/Events';
import { __ } from '../../utilities/StringProvider';
import { CategoryHeader } from './CategoryHeader';
import { Divider } from './Divider';
import { Footer } from './Footer';
import { AccountsPage } from './pages/AccountsPage';
import { AppearancePage } from './pages/AppearancePage';
import { MyAccountPage } from './pages/MyAccountPage';
import { OverlayPage } from './pages/OverlayPage';
import { Page } from './pages/Page';
import { SystemPage } from './pages/SystemPage';
import { VoicePage } from './pages/VoicePage';
import { SectionList } from './SectionList';

export type Element = Page | Divider | CategoryHeader | Footer;

export class SettingsView extends QWidget {
  private elements: Element[] = [
    new AccountsPage(),
    new Divider(),
    new CategoryHeader(__('USER_SETTINGS')),
    new MyAccountPage(),
    new Divider(),
    new CategoryHeader(__('APP_SETTINGS')),
    new AppearancePage(),
    new OverlayPage(),
    new VoicePage(),
    new Divider(),
    new SystemPage(),
    new Footer(),
  ];

  private leftSpacer = new QWidget();

  private sectionList = new SectionList(this.elements);

  private pageContainer = new QScrollArea();

  private pageWidget = new QStackedWidget();

  private closeContainer = new QWidget();

  private rightSpacer = new QWidget();

  private currentPage: Page = this.elements[0] as Page;

  layout = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.setLayout(this.layout);
    this.setObjectName('SettingsView');
    this.initView();
    this.setEvents();
    this.elements
      .filter((element) => element instanceof Page)
      .forEach((page) => this.pageWidget.addWidget(page));

    this.pageWidget.setCurrentWidget(this.currentPage);

    app.on(Events.SWITCH_VIEW, (view: string) => {
      if (view !== 'settings') {
        this.currentPage.onClosed();
      } else {
        this.currentPage.onOpened();
      }
    });
  }

  private setEvents() {
    app.on(Events.OPEN_SETTINGS_PAGE, (pageTitle: string) => {
      const page = <Page>this.elements.find((p) => p instanceof Page && p.title === pageTitle);

      this.currentPage.onClosed();
      this.pageWidget.setCurrentWidget(page);
      this.currentPage = page;
      this.currentPage.onOpened();
    });
  }

  private initView() {
    const {
      layout,
      leftSpacer,
      sectionList,
      pageContainer,
      closeContainer,
      rightSpacer,
      pageWidget,
    } = this;

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);

    leftSpacer.setObjectName('LeftSpacer');

    const closeLayout = new QBoxLayout(Direction.TopToBottom);

    closeContainer.setLayout(closeLayout);
    closeLayout.setContentsMargins(0, 60, 21, 0);
    closeLayout.setSpacing(0);

    pageWidget.setFrameShape(Shape.NoFrame);
    pageWidget.setObjectName('SettingsContainer');

    pageContainer.setFrameShape(Shape.NoFrame);
    pageContainer.setMinimumSize(460, 0);
    pageContainer.setMaximumSize(740, MAX_QSIZE);
    pageContainer.setObjectName('SettingsContainer');
    pageContainer.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    pageContainer.setWidget(pageWidget);

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
