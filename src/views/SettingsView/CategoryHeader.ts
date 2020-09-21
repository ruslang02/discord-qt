import { QLabel } from '@nodegui/nodegui';

export class CategoryHeader extends QLabel {
  constructor(text: string) {
    super();
    this.setObjectName('CategoryHeader');
    this.setText(text);
  }
}
