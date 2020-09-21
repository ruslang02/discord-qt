import { QLineEdit } from '@nodegui/nodegui';

export class DLineEdit extends QLineEdit {
  constructor(parent?: any) {
    super(parent);
    this.setObjectName('DLineEdit');
  }
}
