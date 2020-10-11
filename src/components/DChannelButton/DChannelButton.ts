import {
  CursorShape, Direction, QBoxLayout, QCursor, QLabel, QPushButton, WidgetEventTypes,
} from '@nodegui/nodegui';

export class DChannelButton extends QPushButton {
  layout = new QBoxLayout(Direction.LeftToRight);

  labels: QLabel[] = [];

  private _hovered = false;

  private _activated = false;

  private _unread = false;

  constructor(parent: any) {
    super(parent);
    this.setObjectName('DChannelButton');
    this.setLayout(this.layout);
    this.layout.setContentsMargins(8, 4, 8, 4);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.addEventListener(WidgetEventTypes.HoverEnter,
      () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave,
      () => this.setHovered(false));
  }

  private unread() { return this._unread; }

  setUnread(unread: boolean) {
    if (this.native.destroyed) return;
    this._unread = unread;
    this.setProperty('unread', unread);
    [this, ...this.labels].forEach((w) => w.repolish());
  }

  private hovered() { return this._hovered; }

  setHovered(hovered: boolean) {
    if (this.native.destroyed) return;
    this._hovered = hovered;
    this.setProperty('hover', hovered);
    [this, ...this.labels].forEach((w) => w.repolish());
  }

  activated() { return this._activated; }

  setActivated(activated: boolean) {
    if (this.native.destroyed) return;
    this._activated = activated;
    this.setProperty('active', activated);
    [this, ...this.labels].forEach((w) => w.repolish());
  }
}
