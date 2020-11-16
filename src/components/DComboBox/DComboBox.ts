import { CursorShape, QComboBox } from '@nodegui/nodegui';

export class DComboBox extends QComboBox {
  constructor(parent?: any) {
    super(parent);

    this.setObjectName('DComboBox');
    this.setCursor(CursorShape.PointingHandCursor);
  }
}
