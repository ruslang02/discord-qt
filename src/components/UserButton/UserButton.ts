import { QLabel, QPixmap, QBoxLayout, Direction, WidgetEventTypes, AlignmentFlag } from "@nodegui/nodegui";
import { User, GuildMember, Presence, Client, Constants } from "discord.js";
import TWEmoji from 'twemoji';
import { pictureWorker } from "../../utilities/PictureWorker";
import { DChannelButton } from '../DChannelButton/DChannelButton';

import { app, MAX_QSIZE } from '../..';
import { PresenceStatusColor } from '../../structures/PresenceStatusColor';
import { Events } from '../../structures/Events';
import { resolveEmoji } from '../../utilities/ResolveEmoji';

const buttons = new WeakMap<User | GuildMember, UserButton>();
setTimeout(() => {
  app.on(Events.NEW_CLIENT, (client: Client) => {
    const { Events: DEvents } = Constants;
    client.on(DEvents.PRESENCE_UPDATE, (_o, presence) => {
      if (!presence.user) return;
      const btn = buttons.get(presence.user);
      btn?.loadPresence(presence);
    });
    client.on(DEvents.GUILD_MEMBER_UPDATE, (o, m) => {
      const oldMember = o as GuildMember;
      const member = m as GuildMember;
      const btn = buttons.get(member);
      if (!btn) return;
      if (btn.isGuildMember) btn.loadUser(member); else btn.loadUser(member.user);
      if (oldMember.user.avatar !== member.user.avatar) btn.loadAvatar();
    });
    client.on(DEvents.USER_UPDATE, (o, u) => {
      const oldUser = o as User;
      const user = u as User;
      const btn = buttons.get(user);
      if (!btn || btn.isGuildMember) return;
      btn.loadUser(user);
      if (oldUser.avatar !== user.avatar) btn.loadAvatar();
    })
  });
}, 0);

export class UserButton extends DChannelButton {
  private avatar = new QLabel(this);
  private nameLabel = new QLabel(this);
  private statusInd = new QLabel(this);
  private nameLayout = new QBoxLayout(Direction.LeftToRight);
  private statusIcon = new QLabel(this);
  private statusLabel = new QLabel(this);
  private statusLayout = new QBoxLayout(Direction.LeftToRight);
  private infoControls = new QBoxLayout(Direction.TopToBottom);
  user?: User;
  isGuildMember = false;

  constructor(parent?: any) {
    super(parent);
    this.setProperty('type', 'user');
    this.setFixedSize(224, 42);
    this.setFlexNodeSizeControlled(false);
    this.initComponent();
  }

  initComponent() {
    const { avatar, nameLabel, nameLayout, layout, infoControls, statusLayout, statusLabel, statusIcon, statusInd } = this;

    if (!app.config.enableAvatars) avatar.hide();
    avatar.setFixedSize(32, 32);
    avatar.setObjectName('Avatar');
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0, 0, 0, 0);
    nameLabel.setObjectName('UserNameLabel');
    nameLabel.setMinimumSize(24, 0);
    nameLabel.setFlexNodeSizeControlled(false);
    statusLabel.setAlignment(AlignmentFlag.AlignVCenter);
    statusLabel.setObjectName('StatusLabel');
    statusIcon.setMinimumSize(0, 0);
    statusInd.setText('●');
    nameLayout.setSpacing(6);
    nameLayout.addWidget(nameLabel);
    nameLayout.addWidget(statusInd, 1);
    statusLayout.setSpacing(4);
    statusLayout.addWidget(statusIcon);
    statusLayout.addWidget(statusLabel, 1);

    infoControls.addLayout(nameLayout);
    infoControls.addLayout(statusLayout);

    layout.setSpacing(10);
    layout.addWidget(avatar, 0);
    layout.addLayout(infoControls, 1);
    this.labels = [nameLabel, statusLabel];

    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
  }
  private hasPixmap = false;
  async loadAvatar() {
    if (!app.config.enableAvatars || !this.user || this.hasPixmap) return;
    this.hasPixmap = true;
    const path = await pictureWorker.loadImage(
      this.user.avatarURL({ format: "png", size: 256 }) || this.user.defaultAvatarURL
    );
    path && this.avatar.setPixmap(new QPixmap(path).scaled(32, 32, 1, 1));
  }

  async loadPresence(presence: Presence) {
    this.statusInd.setInlineStyle(`color: ${PresenceStatusColor.get(presence.status)}`);
    this.loadStatusEmoji(presence);

    if (presence.activities.length) {
      const { type, name, state } = presence.activities[0];
      [this.statusLabel, this.statusIcon].forEach(w => w.setMaximumSize(MAX_QSIZE, MAX_QSIZE));
      let status = '';

      switch (type) {
        case 'LISTENING':
          status = `Listening to <b>${name}</b>`;
          break;
        case 'PLAYING':
          status = `Playing <b>${name}</b>`;
          break;
        case 'STREAMING':
          status = `Streaming <b>${name}</b>`;
          break;
        case 'WATCHING':
          status = `Watching <b>${name}</b>`;
          break;
        case 'CUSTOM_STATUS':
          status = state || '';
      }
      this.statusLabel.setText(status);
    } else {
      [this.statusLabel, this.statusIcon].forEach(w => w.setMaximumSize(MAX_QSIZE, 0));
    }
  }

  async loadStatusEmoji(presence: Presence) {
    this.statusIcon.hide();
    const activity = presence.activities.find(a => !!a.emoji);
    if (!activity || !activity.emoji) return;
    // @ts-ignore
    const emojiPath = await resolveEmoji({ emoji_id: activity.emoji.id, emoji_name: activity.emoji.name });
    if (!emojiPath) return;
    const pix = new QPixmap(emojiPath);
    this.statusIcon.setPixmap(pix.scaled(14, 14, 1, 1));
    this.statusIcon.show();
  }

  async loadUser(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.isGuildMember = !!member;
    this.user = user;

    this.nameLabel.setText(member?.nickname ?? user.username);
    this.loadPresence(user.presence);
    buttons.set(user, this);
    if (member) buttons.set(member, this);
  }
}