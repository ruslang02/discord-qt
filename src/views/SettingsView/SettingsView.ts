import { QWidget, QStackedWidget, FlexLayout, QBoxLayout, Direction, QScrollArea, QPushButton, QIcon, QSize, QLabel } from "@nodegui/nodegui";
import './SettingsView.scss';
import { DIconButton } from "../../components/DIconButton/DIconButton";
import { join } from "path";
import { SectionList } from "../../components/SectionList/SectionList";

export class SettingsView extends QWidget {
  private leftSpacer = new QWidget();
  private sectionList = new SectionList();
  private pageContainer = new QScrollArea();
  private closeContainer = new QWidget();
  private rightSpacer = new QWidget();
  layout = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.initView();
  }
  initView() {
    const { layout, leftSpacer, sectionList, pageContainer, closeContainer, rightSpacer } = this;
    this.setLayout(layout);
    this.setObjectName("SettingsView");

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);

    leftSpacer.setObjectName('LeftSpacer');

    const closeLayout = new QBoxLayout(Direction.TopToBottom);
    closeContainer.setLayout(closeLayout);
    closeLayout.setContentsMargins(0, 60, 0, 0);
    closeLayout.setSpacing(8);

    const closeBtn = new QPushButton();
    closeBtn.setObjectName('CloseButton');
    closeBtn.setFixedSize(36, 36);
    closeBtn.setIcon(new QIcon(join(__dirname, '../assets/icons/close.png')));
    closeBtn.setIconSize(new QSize(18, 18));

    const closeKeybind = new QLabel();
    closeKeybind.setObjectName('CloseKeybind');
    closeKeybind.setText('ESC');

    layout.addWidget(leftSpacer, 1);
    layout.addWidget(sectionList, 0);
    layout.addWidget(pageContainer, 0);
    layout.addWidget(closeContainer, 0);
    layout.addWidget(rightSpacer, 1);
  }
}