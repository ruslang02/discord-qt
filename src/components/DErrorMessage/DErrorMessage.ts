import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';


export class DErrorMessage extends QLabel {
  constructor(parent?: any) {
    super(parent);

    this.setObjectName('DErrorMessage');
    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => this.hide());
  }
}