import {
  ButtonRole,
  ContextMenuPolicy,
  QAction,
  QApplication,
  QClipboardMode,
  QLabel,
  QMenu,
  QMessageBox,
  QPixmap,
  QPoint,
  QPushButton,
} from '@nodegui/nodegui';
import { GuildChannel, TextChannel, VoiceChannel } from 'discord.js';
import { __ } from 'i18n';
import open from 'open';
import { join } from 'path';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { DChannelButton } from '../DChannelButton/DChannelButton';

export class ChannelButton extends DChannelButton {
  private static Icons = new Map([
    ['text', new QPixmap(join(__dirname, './assets/icons/pound.png'))],
    ['news', new QPixmap(join(__dirname, './assets/icons/bullhorn.png'))],
    ['voice', new QPixmap(join(__dirname, './assets/icons/volume-high.png'))],
  ])

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
    this.setInlineStyle('margin-left: 8px');
    this.layout.setContentsMargins(12, 4, 12, 4);
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
        ChannelButton.openVoiceChannel(channel as VoiceChannel);
        break;
      default:
    }
  }

  private static openVoiceChannel(channel: VoiceChannel) {
    const msgBox = new QMessageBox();
    msgBox.setText(__('VOICE_NOT_SUPPORTED'));
    msgBox.setWindowTitle('DiscordQt');
    msgBox.setProperty('icon', 4);
    const noBtn = new QPushButton();
    noBtn.setText(__('NO_TEXT'));
    msgBox.addButton(noBtn, ButtonRole.NoRole);
    const yesBtn = new QPushButton();
    yesBtn.setText(__('YES_TEXT'));
    msgBox.addButton(yesBtn, ButtonRole.YesRole);
    yesBtn.addEventListener('clicked', () => {
      open(`https://discord.com/channels/${channel.guild.id}/${channel.id}`);
    });
    msgBox.open();
  }

  private initComponent() {
    const {
      chicon, chlabel, layout, unreadIcon,
    } = this;
    layout.setSpacing(6);
    chlabel.setInlineStyle('font-size: 16px; line-height: 20px;');
    this.labels.push(chlabel);
    layout.addWidget(chicon);
    layout.addWidget(chlabel, 1);

    unreadIcon.setObjectName('UnreadIndicator');
    unreadIcon.move(-4, 12);
    unreadIcon.setFixedSize(8, 8);
    unreadIcon.hide();
  }

  setUnread(value: boolean) {
    super.setUnread(value);
    if (value) this.unreadIcon.show(); else this.unreadIcon.hide();
  }

  loadChannel(channel: GuildChannel) {
    const { channelMenu, chicon } = this;
    this.channel = channel;
    this.chlabel.setText(channel.name);
    const pixmap = ChannelButton.Icons.get(channel.type);
    if (pixmap) chicon.setPixmap(pixmap);
    if (channel instanceof TextChannel) {
      this.setUnread(!channel.acknowledged);
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
