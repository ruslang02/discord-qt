import { Direction, QBoxLayout, QWidget } from '@nodegui/nodegui';

export class DTitleBar extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.setObjectName('DTitleBar');
    this.setLayout(this.controls);
  }
}
