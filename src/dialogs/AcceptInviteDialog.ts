import { Direction, QBoxLayout, QLabel, QWidget } from '@nodegui/nodegui';
import { __ } from 'i18n';
import { URL } from 'url';
import { app } from '..';
import { DColorButton } from '../components/DColorButton/DColorButton';
import { DColorButtonColor } from '../components/DColorButton/DColorButtonColor';
import { DErrorMessage } from '../components/DErrorMessage/DErrorMessage';
import { DTextEdit } from '../components/DTextEdit/DTextEdit';
import { Dialog } from './Dialog';

export class AcceptInviteDialog extends Dialog {
  private urlLabel = new QLabel(this);

  private urlInput = new DTextEdit(this);

  private errMsg = new DErrorMessage(this);

  constructor(parent?: any) {
    super(parent);

    this.init();
    this.initFooter();
  }

  private init() {
    const { header, urlLabel, urlInput, errMsg } = this;

    header.setText(__('INSTANT_INVITE_ACCEPT'));
    const layout = new QBoxLayout(Direction.TopToBottom);

    layout.setSpacing(8);
    layout.setContentsMargins(16, 0, 16, 16);
    urlLabel.setText(__('FORM_LABEL_INVITE_LINK'));
    urlLabel.setObjectName('Header3');
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

    saveBtn.setText(__('OKAY'));
    saveBtn.setMinimumSize(96, 38);
    saveBtn.addEventListener('clicked', () => this.checkInvite());
    const cancelBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);

    cancelBtn.setText(__('CANCEL'));
    cancelBtn.setMinimumSize(80, 38);
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

    if (code.includes('//')) {
      code = new URL(code).pathname.replace(/\//g, '');
    }

    try {
      await app.client.user?.acceptInvite(code);
    } catch (e) {
      this.errMsg.setText(__('INVALID_INVITE_LINK_ERROR'));
      this.errMsg.show();

      return;
    }

    this.urlLabel.clear();
    this.hide();
  }
}
