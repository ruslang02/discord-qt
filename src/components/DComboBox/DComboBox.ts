import { QComboBox, CursorShape } from '@nodegui/nodegui';

export class DComboBox extends QComboBox {
  constructor(parent?: any) {
    super(parent);
    this.setObjectName('DComboBox');
    this.setStyleSheet("::down-arrow { image: url(assets/icons/menu-down.png) }");
    this.setCursor(CursorShape.PointingHandCursor);
  }
}