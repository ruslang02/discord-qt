import { Direction, QBoxLayout, QWidget } from '@nodegui/nodegui';
import { MAX_QSIZE } from '../../..';
import { createLogger } from '../../../utilities/Console';

const { debug } = createLogger('[SettingsView]');

export abstract class Page extends QWidget {
  abstract title: string;

  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.setObjectName('Page');
    this.setLayout(this.layout);
    this.setMinimumSize(740, 0);
    this.setMaximumSize(740, MAX_QSIZE);
    this.layout.setContentsMargins(40, 60, 40, 80);
    this.layout.setSpacing(0);
  }

  onOpened(): void {
    debug('Opened', this.title);
  }

  onClosed(): void {
    debug('Closed', this.title);
  }
}
