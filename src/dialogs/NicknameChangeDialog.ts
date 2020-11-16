import { Direction, QBoxLayout, QLabel, QWidget } from '@nodegui/nodegui';
import { GuildMember } from 'discord.js';
import { __ } from 'i18n';
import { DColorButton } from '../components/DColorButton/DColorButton';
import { DColorButtonColor } from '../components/DColorButton/DColorButtonColor';
import { DErrorMessage } from '../components/DErrorMessage/DErrorMessage';
import { DLabel } from '../components/DLabel/DLabel';
import { DTextEdit } from '../components/DTextEdit/DTextEdit';
import { Dialog } from './Dialog';

/**
 * Represents a dialog is used for changing current guild member's nickname.
 */
export class NicknameChangeDialog extends Dialog {
  private nnLabel = new QLabel(this);

  private nnInput = new DTextEdit(this);

  private errMsg = new DErrorMessage(this);

  private member?: GuildMember;

  constructor(parent?: any) {
    super(parent);

    this.init();
    this.initFooter();
  }

  private init() {
    const { header, nnLabel, nnInput, errMsg } = this;

    header.setText(__('CHANGE_NICKNAME'));
    const layout = new QBoxLayout(Direction.TopToBottom);

    layout.setSpacing(8);
    layout.setContentsMargins(16, 0, 16, 16);
    const nnLink = new DLabel(this);

    nnLabel.setText(__('NICKNAME'));
    nnLabel.setObjectName('Header3');
    nnLink.setText(`<a href='#'>${__('RESET_NICKNAME')}</a>`);
    nnLink.addEventListener('linkActivated', () => {
      nnInput.clear();
      void this.save();
    });

    layout.addWidget(nnLabel);
    layout.addWidget(nnInput);
    layout.addWidget(nnLink);
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

    saveBtn.setText(__('SAVE'));
    saveBtn.setMinimumSize(96, 38);
    saveBtn.addEventListener('clicked', this.save.bind(this));
    const cancelBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);

    cancelBtn.setText(__('CANCEL'));
    cancelBtn.setMinimumSize(80, 38);
    cancelBtn.addEventListener('clicked', () => this.hide());
    footLayout.addWidget(cancelBtn);
    footLayout.addWidget(saveBtn);
    footer.setLayout(footLayout);
    this.controls.addWidget(footer);
  }

  openForMember(member: GuildMember) {
    this.nnInput.setPlaceholderText(member.user.username);
    this.nnInput.setText(member.nickname || '');

    if (!member.nickname) {
      this.nnInput.clear();
    }

    this.member = member;
    this.show();
  }

  private async save() {
    try {
      this.errMsg.hide();
      await this.member?.setNickname(this.nnInput.text());
      this.hide();
    } catch (e) {
      this.errMsg.setText(e.message);
      this.errMsg.show();
    }
  }
}
