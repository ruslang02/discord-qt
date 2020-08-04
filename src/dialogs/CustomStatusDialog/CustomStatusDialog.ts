import { Dialog } from '../Dialog';
import { QLabel, QLineEdit, QComboBox } from '@nodegui/nodegui';
import { app } from '../..';
import { Events } from '../../structures/Events';

export class CustomStatusDialog extends Dialog {
  private statusLabel = new QLabel(this);
  private statusInput = new QLineEdit(this);
  private clearLabel = new QLabel(this);
  private clearInput = new QComboBox(this);
  

  constructor(parent?: any) {
    super(parent);
    this.header.setText('Set a custom status');
    this.init();

    app.on(Events.NEW_CLIENT, client => {
      this.statusLabel.setText(`What's cookin', ${client.user?.username}?`);
    });
  }

  private init() {
    const { statusLabel, statusInput, clearLabel, clearInput } = this;
    statusLabel.setObjectName('FormLabel');
    statusInput.setObjectName('StatusInput');
    clearLabel.setObjectName('FormLabel');
    clearInput.setObjectName('ClearInput');
    [statusLabel, statusInput, clearLabel, clearInput].forEach(w => this.layout.addWidget(w));    
  }
}