import './DLineEdit.scss';
import { QLineEdit } from '@nodegui/nodegui';

export class DLineEdit extends QLineEdit {
  constructor() {
    super();
    this.setObjectName('DLineEdit');
  }
}