import { QLineEdit, CursorShape } from '@nodegui/nodegui';

export class DTextEdit extends QLineEdit {
  constructor(parent?: any) {
    super(parent);
    this.setObjectName('DTextEdit');
  }
}