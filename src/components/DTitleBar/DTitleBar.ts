import { QWidget, QBoxLayout, Direction, QGraphicsDropShadowEffect, QColor } from '@nodegui/nodegui';

export class DTitleBar extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private shadow = new QGraphicsDropShadowEffect();

  constructor() {
    super();

    this.setObjectName('DTitleBar');
    this.setLayout(this.controls);
    this.initShadow();
  }
  initShadow() {
    const { shadow } = this;
    shadow.setBlurRadius(5);
    shadow.setColor(new QColor(12, 12, 12, 255));
    shadow.setXOffset(-2);
    shadow.setYOffset(0);

    this.setGraphicsEffect(shadow);
  }
}