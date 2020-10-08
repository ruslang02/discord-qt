import {
  Direction, ItemFlag, MatchFlag, QBoxLayout, QLabel, QListWidget, QListWidgetItem, QPixmap,
} from '@nodegui/nodegui';
import {
  Constants, DQConstants, GuildMember, Snowflake, VoiceChannel,
} from 'discord.js';
import { app } from '../..';
// import { Events as AppEvents } from '../../structures/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { DChannelButton } from '../DChannelButton/DChannelButton';

const { Events } = Constants as unknown as DQConstants;

export class ChannelMembers extends QListWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private buttons = new Map<Snowflake, DChannelButton>();

  private asItem?: QListWidgetItem;

  private channel?: VoiceChannel;

  constructor(parent?: any) {
    super(parent);
    this.setMinimumSize(240, 0);
    this.setUniformItemSizes(true);
    this.setFrameShape(0);
    this.setHorizontalScrollBarPolicy(1);
    this.setInlineStyle('margin-left: 32px;margin-bottom:8px;background-color: transparent;');
    app.client.on(Events.VOICE_STATE_UPDATE, (o, n) => {
      if (!o.member) return;
      if (o.channel === this.channel && n.channel !== this.channel) {
        try {
          const item = this.findItems(o.member.id, MatchFlag.MatchExactly)[0];
          this.buttons.get(o.member.user.id)?.hide();
          this.buttons.delete(o.member.user.id);
          this.takeItem(this.row(item));
        } catch (e) { }
      }
      if (o.channel !== this.channel && n.channel === this.channel) {
        const item = new QListWidgetItem();
        const btn = this.buttons.get(o.member.user.id) || this.createButton(o.member);
        this.layout.addWidget(btn);
        item.setSizeHint(btn.size());
        this.addItem(item);
        this.setItemWidget(item, btn);
        this.buttons.set(o.member.user.id, btn);
      }
      this.adjustSize();
    });
  }

  setItem(item: QListWidgetItem) {
    this.asItem = item;
  }

  adjustSize() {
    this.setFixedSize(240, this.buttons.size === 0 ? 0 : this.buttons.size * 30 + 8);
    this.asItem?.setSizeHint(this.size());
  }

  private createButton(member: GuildMember) {
    const btn = new DChannelButton(this);
    const avatar = new QLabel(btn);
    avatar.setFixedSize(24, 24);
    btn.layout.setSpacing(8);
    btn.setFixedSize(240, 30);
    btn.layout.setContentsMargins(8, 0, 0, 0);
    const memberName = new QLabel(btn);
    btn.labels.push(memberName);
    memberName.setText(member.nickname || member.user.username);
    btn.layout.addWidget(avatar);
    btn.layout.addWidget(memberName, 1);
    pictureWorker.loadImage(member.user.displayAvatarURL({ format: 'png', size: 256 }))
      .then((path) => avatar.setPixmap(new QPixmap(path).scaled(24, 24, 1, 1)));
    return btn;
  }

  /**
   * Loads channel members.
   * @param channel Voice channel to load members of.
   * @returns Whether the widget should be shown.
   */
  loadChannel(channel: VoiceChannel) {
    this.channel = channel;
    this.buttons.clear();
    for (const member of channel.members.values()) {
      const item = new QListWidgetItem();
      item.setFlags(~ItemFlag.ItemIsEnabled);
      item.setText(member.id);
      const btn = this.createButton(member);
      this.layout.addWidget(btn);
      this.addItem(item);
      this.setItemWidget(item, btn);
      item.setSizeHint(btn.size());
      this.buttons.set(member.user.id, btn);
    }
    setTimeout(() => this.adjustSize());
  }
}