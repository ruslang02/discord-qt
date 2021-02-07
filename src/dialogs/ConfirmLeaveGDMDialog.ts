import { Direction, QBoxLayout, QLabel, QWidget } from '@nodegui/nodegui';
import { app } from '..';
import { DColorButton } from '../components/DColorButton/DColorButton';
import { DColorButtonColor } from '../components/DColorButton/DColorButtonColor';
import { GroupDMChannel } from '../patches/GroupDMChannel';
import { Events } from '../utilities/Events';
import { __ } from '../utilities/StringProvider';
import { Dialog } from './Dialog';

export class ConfirmLeaveGDMDialog extends Dialog {
  private channel?: GroupDMChannel;

  private description = new QLabel(this);

  constructor(parent?: any) {
    super(parent);

    this.init();
    this.initFooter();
  }

  private init() {
    const layout = new QBoxLayout(Direction.TopToBottom);

    this.description.setWordWrap(true);
    this.description.setObjectName('Normal');
    layout.setSpacing(8);
    layout.setContentsMargins(16, 0, 16, 24);
    layout.addWidget(this.description);
    this.controls.addLayout(layout);
  }

  private initFooter() {
    const footer = new QWidget(this);

    footer.setObjectName('Footer');
    const footLayout = new QBoxLayout(Direction.LeftToRight);

    footLayout.addStretch(1);
    footLayout.setContentsMargins(16, 16, 16, 16);
    const leaveBtn = new DColorButton(DColorButtonColor.RED);

    leaveBtn.setText(__('LEAVE_GROUP'));
    leaveBtn.setMinimumSize(96, 38);
    leaveBtn.addEventListener('clicked', async () => {
      leaveBtn.setEnabled(false);

      try {
        await this.channel?.delete();
        app.emit(Events.SWITCH_VIEW, 'dm');
      } catch (e) {
      } finally {
        leaveBtn.setEnabled(true);
      }

      this.hide();
    });

    const cancelBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);

    cancelBtn.setText(__('CANCEL'));
    cancelBtn.setMinimumSize(80, 38);
    cancelBtn.addEventListener('clicked', () => this.hide());
    footLayout.addWidget(cancelBtn);
    footLayout.addWidget(leaveBtn);
    footer.setLayout(footLayout);
    this.controls.addWidget(footer);
  }

  open(channel: GroupDMChannel) {
    this.channel = channel;
    const { name } = channel;

    this.header.setText(__('LEAVE_SERVER_TITLE', { name }));
    this.description.setText(__('LEAVE_GROUP_BODY', { name }));
    this.show();
  }
}
