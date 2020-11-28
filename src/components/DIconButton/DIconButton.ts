import {
  CursorShape,
  QCursor,
  QIcon,
  QPushButton,
  QSize,
  WidgetEventTypes,
} from '@nodegui/nodegui';

export class DIconButton extends QPushButton {
  qiconOn = new QIcon();

  qiconOff = new QIcon();

  constructor({
    iconPath,
    tooltipText,
    iconQSize,
    isCheckbox,
    checked,
  }: {
    iconPath: string;
    tooltipText: string;
    iconQSize: QSize;
    isCheckbox?: boolean;
    checked?: boolean
  }) {
    super();

    this.setObjectName('DIconButton');
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setIconSize(iconQSize);

    if (isCheckbox) {
      this.setCheckable(true);
      this.addEventListener('clicked', (value) => {
        this.setIcon(value ? this.qiconOn : this.qiconOff);
      });

      this.setIcon(checked ? this.qiconOn : this.qiconOff);
    } else {
      this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setIcon(this.qiconOn));
      this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setIcon(this.qiconOff));
    }

    this.setIconPath(iconPath);
    this.setToolTip(tooltipText);
  }

  setIconPath(path: string) {
    this.qiconOn = new QIcon(path);
    this.qiconOff = new QIcon(path.replace('.png', '-outline.png'));
    this.setIcon(this.qiconOff);
  }

  setToolTip(text: string) {
    this.setProperty('toolTip', text);
  }
}
