import { QWidget } from '@nodegui/nodegui';
import { MAX_QSIZE } from '../..';

export class Divider extends QWidget {
  constructor() {
    super();
    this.setMinimumSize(20, 17);
    this.setMaximumSize(MAX_QSIZE, 17);
    this.setObjectName('Divider');
  }
}
