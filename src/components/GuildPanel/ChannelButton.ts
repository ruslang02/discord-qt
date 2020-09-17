import { ButtonRole, ContextMenuPolicy, QAction, QApplication, QClipboardMode, QLabel, QMenu, QMessageBox, QPixmap, QPoint, WidgetEventTypes } from '@nodegui/nodegui';
import { GuildChannel, TextChannel } from 'discord.js';
import { __ } from 'i18n';
import open from 'open';
import { join } from 'path';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { DChannelButton } from '../DChannelButton/DChannelButton';
import { DColorButton, DColorButtonColor } from '../DColorButton/DColorButton';
export class ChannelButton extends DChannelButton {
  private static Icons = {
    pound: new QPixmap(join(__dirname, './assets/icons/pound.png')),
    bullhorn: new QPixmap(join(__dirname, './assets/icons/bullhorn.png')),
    volume_high: new QPixmap(join(__dirname, './assets/icons/volume-high.png')),
  };
  private chicon = new QLabel(this);
  private chlabel = new QLabel(this);
  private clipboard = QApplication.clipboard();
  private channelMenu = new QMenu(this);
  private unreadIcon = new QLabel(this);
  channel?: GuildChannel;

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener('clicked', this.handleClick.bind(this));
  }

  private handleClick() {
    const { channel } = this;
    if (!channel) return;
    switch (channel.type) {
      case 'news':
      case 'text':
        app.emit(Events.SWITCH_VIEW, 'guild', { channel });
        break;
      case 'voice':
        const msgBox = new QMessageBox(this);
        msgBox.setText(__('VOICE_NOT_SUPPORTED'));
        msgBox.setWindowTitle('DiscordQt');
        msgBox.setProperty('icon', 4);
        const noBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);
        noBtn.setText(__('NO_TEXT'));
        msgBox.addButton(noBtn, ButtonRole.NoRole);
        const yesBtn = new DColorButton(DColorButtonColor.BLURPLE);
        yesBtn.setText(__('YES_TEXT'));
        msgBox.addButton(yesBtn, ButtonRole.YesRole);
        yesBtn.addEventListener('clicked', () => {
          open(`https://discord.com/channels/${channel.guild.id}/${channel.id}`);
        });
        msgBox.open();
        break;
    }
  }

  private initComponent() {
    const { chicon, chlabel, layout, unreadIcon } = this;
    layout.setSpacing(6);
    chlabel.setInlineStyle('font-size: 16px; line-height: 20px;');
    this.labels.push(chlabel);
    layout.addWidget(chicon);
    layout.addWidget(chlabel, 1);

    unreadIcon.setText('●');
    unreadIcon.setObjectName('Indicator');
    unreadIcon.hide();
    layout.addWidget(unreadIcon);
  }

  setUnread(value: boolean) {
    super.setUnread(value);
    !!value ? this.unreadIcon.show() : this.unreadIcon.hide();
  }

  loadChannel(channel: GuildChannel) {
    const { channelMenu, chicon } = this;
    this.channel = channel;
    this.chlabel.setText(channel.name);
    switch (channel.type) {
      case 'text':
        chicon.setPixmap(ChannelButton.Icons.pound);
        break;
      case 'voice':
        chicon.setPixmap(ChannelButton.Icons.volume_high);
        break;
      case 'news':
        chicon.setPixmap(ChannelButton.Icons.bullhorn);
        break;
    }
    if (channel instanceof TextChannel) {
      this.setUnread(!channel.acknowledged)
    }
    // channelMenu.setInlineStyle('background: #18191c');
    const copyId = new QAction();
    copyId.setText(__('COPY_ID'));
    copyId.addEventListener('triggered', () => {
      this.clipboard.setText(channel.id, QClipboardMode.Clipboard);
    });
    channelMenu.addAction(copyId);
    this.addEventListener('customContextMenuRequested', (pos) => {
      channelMenu.repolish();
      channelMenu.popup(this.mapToGlobal(new QPoint(pos.x, pos.y)));
    });
  }
}