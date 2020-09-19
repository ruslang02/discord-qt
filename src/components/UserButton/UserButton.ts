import {
  AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  ActivityType, Client, Constants, GuildMember, Presence, User,
} from 'discord.js';
import { __ } from 'i18n';
import { app, MAX_QSIZE } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { PresenceStatusColor } from '../../structures/PresenceStatusColor';
import { pictureWorker } from '../../utilities/PictureWorker';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { DChannelButton } from '../DChannelButton/DChannelButton';

export class UserButton extends DChannelButton {
  private static ActivityTypeText: Map<ActivityType, string> = new Map([
    ['LISTENING', 'LISTENING_TO'],
    ['PLAYING', 'PLAYING_GAME'],
    ['WATCHING', 'WATCHING'],
    ['STREAMING', 'STREAMING'],
  ]);

  private static buttons = new WeakMap<User | GuildMember, UserButton>();

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

  static init() {
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;
      client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
        if (!presence.user) return;
        const btn = UserButton.buttons.get(presence.user);
        btn?.loadPresence(presence);
      });
      client.on(Events.GUILD_MEMBER_UPDATE, (o, m) => {
        const oldMember = o as GuildMember;
        const member = m as GuildMember;
        const btn = UserButton.buttons.get(member);
        if (!btn) return;
        if (btn.isGuildMember) btn.loadUser(member); else btn.loadUser(member.user);
        if (oldMember.user.avatar !== member.user.avatar) btn.loadAvatar();
      });
      client.on(Events.USER_UPDATE, (o, u) => {
        const oldUser = o as User;
        const user = u as User;
        const btn = UserButton.buttons.get(user);
        if (!btn || btn.isGuildMember) return;
        btn.loadUser(user);
        if (oldUser.avatar !== user.avatar) btn.loadAvatar();
      });
    });
  }

  initComponent() {
    const {
      avatar,
      nameLabel,
      nameLayout,
      layout,
      infoControls,
      statusLayout,
      statusLabel,
      statusIcon,
      statusInd,
    } = this;

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
      this.user.avatarURL({ format: 'png', size: 256 }) || this.user.defaultAvatarURL,
    );
    if (path) this.avatar.setPixmap(new QPixmap(path).scaled(32, 32, 1, 1));
  }

  async loadPresence(presence: Presence) {
    if (this._destroyed) return;
    this.statusInd.setInlineStyle(`color: ${PresenceStatusColor.get(presence.status)}`);
    this.loadStatusEmoji(presence);

    if (presence.activities.length) {
      const { type, name, state } = presence.activities[0];
      [this.statusLabel, this.statusIcon].forEach((w) => w.setMaximumSize(MAX_QSIZE, MAX_QSIZE));
      let status = '';
      if (type === 'CUSTOM_STATUS') status = state || '';
      else status = __(UserButton.ActivityTypeText.get(type) || '', { name, game: name });
      this.statusLabel.setText(status);
    } else {
      [this.statusLabel, this.statusIcon].forEach((w) => w.setMaximumSize(MAX_QSIZE, 0));
    }
  }

  async loadStatusEmoji(presence: Presence) {
    this.statusIcon.hide();
    const activity = presence.activities.find((a) => !!a.emoji);
    if (!activity || !activity.emoji || !activity.emoji.id) return;
    // @ts-ignore
    const emojiPath = await resolveEmoji({
      emoji_id: activity.emoji.id,
      emoji_name: activity.emoji.name,
    });
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
    UserButton.buttons.set(user, this);
    if (member) UserButton.buttons.set(member, this);
  }
}
setTimeout(UserButton.init);
