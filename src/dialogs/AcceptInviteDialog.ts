import { Dialog } from './Dialog';
import { QBoxLayout, QWidget, Direction, QLabel, QLineEdit } from '@nodegui/nodegui';
import { DColorButton, DColorButtonColor } from '../components/DColorButton/DColorButton';
import { app } from '..';
import { DErrorMessage } from '../components/DErrorMessage/DErrorMessage';
import { URL } from 'url';

export class AcceptInviteDialog extends Dialog {
  private urlLabel = new QLabel(this);
  private urlInput = new QLineEdit(this);
  private errMsg = new DErrorMessage(this);

  constructor(parent?: any) {
    super(parent);

    this.init();
    this.initFooter();
  }

  private init() {
    const { header, urlLabel, urlInput, errMsg } = this;
    header.setText('Accept server invite');
    const layout = new QBoxLayout(Direction.TopToBottom);
    layout.setSpacing(8);
    layout.setContentsMargins(16, 0, 16, 16);
    urlLabel.setText('Invite link');
    urlLabel.setObjectName('FormLabel');
    urlInput.setObjectName('StatusInput');
    urlInput.setPlaceholderText('https://discord.gg/...');
    layout.addWidget(urlLabel);
    layout.addWidget(urlInput);
    layout.addWidget(errMsg);
    errMsg.hide();
    this.controls.addLayout(layout);
  }

  private initFooter() {
    const footer = new QWidget(this);
    footer.setObjectName('Footer');
    const footLayout = new QBoxLayout(Direction.LeftToRight);
    footLayout.addStretch(1);
    footLayout.setContentsMargins(16, 16, 16, 16);
    const saveBtn = new DColorButton(DColorButtonColor.BLURPLE);
    saveBtn.setText('Accept');
    saveBtn.setFixedSize(96, 38);
    saveBtn.addEventListener('clicked', () => this.checkInvite());
    const cancelBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);
    cancelBtn.setText('Cancel');
    cancelBtn.setFixedSize(80, 38);
    cancelBtn.addEventListener('clicked', () => this.hide());
    footLayout.addWidget(cancelBtn);
    footLayout.addWidget(saveBtn);
    footer.setLayout(footLayout);
    this.controls.addWidget(footer);
  }
  async checkInvite(url?: string) {
    if (url) {
      this.urlInput.setText(url);
      this.show();
      this.raise();
    }
    let code = this.urlInput.text();
    if (code.includes('//'))
      code = new URL(code).pathname.replace(/\//g, '');
    try {
      await app.client.user?.acceptInvite(code);
    } catch (e) {
      this.errMsg.setText('This invite link is not valid.');
      this.errMsg.show();
      return;
    }
    this.urlLabel.clear();
    this.hide();
  }
}