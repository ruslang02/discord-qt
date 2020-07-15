import { QPushButton, QSize, QIcon, WidgetEventTypes, QCursor, CursorShape } from "@nodegui/nodegui";
import './DIconButton.scss';

export class DIconButton extends QPushButton {
  iconPath: string = '';
  iconPathInactive: string = '';
  tooltipText: string = '';
  iconQSize = new QSize(24, 24);

  constructor(options: {
    iconPath: string,
    tooltipText: string,
    iconQSize: QSize
  }) {
    super();
    Object.assign(this, options);
    this.iconPathInactive = this.iconPath.replace('.png', '-outline.png');

    this.setObjectName('DIconButton');
    this.initComponent();
  }

  initComponent() {
    const { iconPath, iconPathInactive, tooltipText, iconQSize } = this;
    this.setProperty('toolTip', tooltipText);
    const activeIcon = new QIcon(iconPath);
    const inactiveIcon = new QIcon(iconPathInactive);
    this.setIcon(inactiveIcon);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setIconSize(iconQSize);
    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setIcon(activeIcon));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setIcon(inactiveIcon));
  }
}