import { QTextEdit } from '@nodegui/nodegui';

export class DTextEditMultiline extends QTextEdit {
  constructor(parent?: any) {
    super(parent);

    this.setObjectName('DTextEdit');
  }
}
