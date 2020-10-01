import {
  Direction, QBoxLayout, QLabel, QSize, QWidget,
} from '@nodegui/nodegui';
import { join } from 'path';
import { DIconButton } from '../DIconButton/DIconButton';

export class VoicePanel extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  infoLabel = new QLabel(this);

  discntBtn = new DIconButton({
    iconPath: join(__dirname, 'assets/icons/phone-remove.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Disconnect',
  });

  constructor() {
    super();
    // this.hide();
    this.setObjectName('VoicePanel');
    this.initComponent();
  }

  private initComponent() {
    const { layout, infoLabel, discntBtn } = this;
    layout.setContentsMargins(8, 8, 8, 8);
    layout.setSpacing(8);

    const infoLayout = new QBoxLayout(Direction.LeftToRight);
    infoLayout.addWidget(infoLabel, 1);
    infoLayout.addWidget(discntBtn, 1);
    layout.addLayout(infoLayout);
  }
}
