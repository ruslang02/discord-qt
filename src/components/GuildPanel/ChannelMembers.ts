import {
  AlignmentFlag,
  ContextMenuPolicy,
  Direction,
  ItemFlag,
  QBoxLayout,
  QLabel,
  QListWidget,
  QListWidgetItem,
  QPixmap,
  QPoint,
} from '@nodegui/nodegui';
import { GuildMember, Snowflake, VoiceChannel, VoiceConnection, VoiceState } from 'discord.js';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { DChannelButton } from '../DChannelButton/DChannelButton';

const { error } = createLogger('ChannelMembers');

export class ChannelMembers extends QListWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private buttons = new Map<Snowflake, DChannelButton>();

  private asItem?: QListWidgetItem;

  private connection?: VoiceConnection;

  private p0 = new QPoint(0, 0);

  constructor(private channel: VoiceChannel) {
    super();

    this.setMinimumSize(240, 0);
    this.setUniformItemSizes(true);
    this.setFrameShape(0);
    this.setHorizontalScrollBarPolicy(1);
    this.setObjectName('ChannelMembers');

    this.loadChannel(channel);
  }

  handleVoiceStateUpdate(o: VoiceState, n: VoiceState) {
    if (this.native.destroyed || !o.member) {
      return;
    }

    if (n.connection && n.connection !== this.connection) {
      this.connection = n.connection;

      n.connection.on('speaking', (user, speaking) => {
        const ubtn = this.buttons.get(user.id);

        if (ubtn) {
          ubtn.setStyleSheet(
            speaking.bitfield === 1
              ? '#Avatar { border: 2px solid #43b581; padding: 3px; border-radius: 12px; }'
              : '',
          );
        }
      });
    }

    if (o.channel === this.channel && n.channel !== this.channel) {
      this.buttons.get(o.member.user.id)?.hide();
      this.buttons.delete(o.member.user.id);

      const item = this.findItems(o.member.user.id, 0)[0];

      this.takeItem(this.row(item));

      if (o.member.user.id === app.client.user?.id) {
        this.buttons.forEach((btn) => btn.setStyleSheet(''));
      }
    }

    if (o.channel !== this.channel && n.channel === this.channel) {
      const btn = this.buttons.get(o.member.user.id) || this.createButton(o.member);

      this.layout.addWidget(btn);
      this.buttons.set(o.member.user.id, btn);

      const item = new QListWidgetItem();

      item.setSizeHint(btn.size());
      item.setFlags(~ItemFlag.ItemIsEnabled);
      item.setText(o.member.user.id);

      this.addItem(item);
      this.setItemWidget(item, btn);
    }

    this.adjustSize();
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
    avatar.setObjectName('Avatar');
    avatar.setAlignment(AlignmentFlag.AlignCenter);

    btn.layout.setSpacing(8);
    btn.setFixedSize(200, 30);
    btn.addEventListener('clicked', () => {
      const map = btn.mapToGlobal(this.p0);

      map.setX(map.x() + 200);
      app.emit(AppEvents.OPEN_USER_PROFILE, member.id, member.guild.id, map);
    });

    // @ts-ignore
    btn.avatar = avatar;
    btn.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    btn.layout.setContentsMargins(8, 0, 0, 0);
    btn.addEventListener('customContextMenuRequested', ({ x, y }) => {
      app.emit(AppEvents.OPEN_USER_MENU, member, btn.mapToGlobal(new QPoint(x, y)));
    });

    const memberName = new QLabel(btn);

    memberName.setText(member.nickname || member.user.username);

    btn.labels.push(memberName);
    btn.layout.addWidget(avatar);
    btn.layout.addWidget(memberName, 1);

    pictureWorker
      .loadImage(member.user.displayAvatarURL({ format: 'png', size: 256 }))
      .then((path) => avatar.setPixmap(new QPixmap(path).scaled(24, 24, 1, 1)))
      .catch(error.bind(console, "Couldn't load avatar."));

    return btn;
  }

  /**
   * Loads channel members.
   * @param channel Voice channel to load members of.
   * @returns Whether the widget should be shown.
   */
  loadChannel(channel: VoiceChannel) {
    this.buttons.clear();

    for (const member of channel.members.values()) {
      const item = new QListWidgetItem();

      item.setFlags(~32);
      item.setText(member.id);

      const btn = this.createButton(member);

      this.layout.addWidget(btn);

      this.addItem(item);
      this.setItemWidget(item, btn);
      item.setSizeHint(btn.size());

      this.buttons.set(member.user.id, btn);
    }

    setTimeout(() => this.adjustSize(), 0);
  }
}
