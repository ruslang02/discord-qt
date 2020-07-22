import { QPushButton, QBoxLayout, Direction, QCursor, CursorShape, QWidget, QLabel } from '@nodegui/nodegui';
import './DChannelButton.scss';

export class DChannelButton extends QPushButton {
  layout = new QBoxLayout(Direction.LeftToRight);
  labels: QLabel[] = [];
  private _hovered = false;
  private _activated = false;

  constructor(parent: any) {
    super(parent);
    this.setObjectName('DChannelButton');
    this.setLayout(this.layout);
    this.layout.setContentsMargins(8, 4, 8, 4);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
  }

  private hovered() { return this._hovered; }

  setHovered(hovered: boolean) {
    this._hovered = hovered;
    this.setProperty('hover', hovered);
    [this, ...this.labels].forEach(w => w.repolish());
  }

  activated() { return this._activated; }

  setActivated(activated: boolean) {
    this._activated = activated;
    this.setProperty('active', activated);
    [this, ...this.labels].forEach(w => w.repolish());
  }
}