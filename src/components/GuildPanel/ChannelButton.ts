import {
  ContextMenuPolicy,
  QLabel,
  QPixmap,
} from '@nodegui/nodegui';
import { GuildChannel, TextChannel, VoiceChannel } from 'discord.js';
import { join } from 'path';
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { DChannelButton } from '../DChannelButton/DChannelButton';

export class ChannelButton extends DChannelButton {
  private static Icons = new Map([
    ['text', new QPixmap(join(__dirname, './assets/icons/pound.png'))],
    ['news', new QPixmap(join(__dirname, './assets/icons/bullhorn.png'))],
    ['voice', new QPixmap(join(__dirname, './assets/icons/volume-high.png'))],
  ])

  private chicon = new QLabel(this);

  private chlabel = new QLabel(this);

  private unreadIcon = new QLabel(this);

  channel?: GuildChannel;

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener('clicked', this.handleClick.bind(this));
    this.layout.setContentsMargins(12, 4, 12, 4);
  }

  private handleClick() {
    const { channel } = this;
    if (!channel || this.activated()) return;
    switch (channel.type) {
      case 'news':
      case 'text':
        app.emit(Events.SWITCH_VIEW, 'guild', { channel });
        break;
      case 'voice':
        app.emit(Events.JOIN_VOICE_CHANNEL, channel as VoiceChannel);
        break;
      default:
    }
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

  setMuted(value: boolean) {
    super.setMuted(value);
    this.setUnread(this.unread());
  }

  setUnread(value: boolean) {
    super.setUnread(value);
    if (value && !this.muted()) this.unreadIcon.show(); else this.unreadIcon.hide();
  }

  loadChannel(channel: GuildChannel) {
    const { chicon } = this;
    this.channel = channel;
    this.chlabel.setText(channel.name);
    const pixmap = ChannelButton.Icons.get(channel.type);
    if (pixmap) chicon.setPixmap(pixmap);
    if (channel instanceof TextChannel && !channel.acknowledged) this.setUnread(true);
  }
}
