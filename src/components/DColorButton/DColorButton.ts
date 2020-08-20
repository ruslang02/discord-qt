import { QPushButton, CursorShape } from '@nodegui/nodegui';


export enum DColorButtonColor {
  BLURPLE = 0,
  RED = 1,
  RED_TEXT = 2,
  WHITE_TEXT = 3,
}
export class DColorButton extends QPushButton {
  constructor(color = DColorButtonColor.BLURPLE) {
    super();

    this.setObjectName('DColorButton');
    this.setProperty('color', color);
    this.setCursor(CursorShape.PointingHandCursor);
  }
}