import { CursorShape, QPushButton } from '@nodegui/nodegui';
import { DColorButtonColor } from './DColorButtonColor';

export class DColorButton extends QPushButton {
  constructor(color = DColorButtonColor.BLURPLE) {
    super();

    this.setObjectName('DColorButton');
    this.setProperty('color', color);
    this.setCursor(CursorShape.PointingHandCursor);
  }
}
