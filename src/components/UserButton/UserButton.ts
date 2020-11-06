import {
  AlignmentFlag,
  ContextMenuPolicy,
  Direction,
  QBoxLayout,
  QLabel,
  QPixmap,
  QPoint,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  ActivityType, Client, Constants, GuildMember, Presence, User,
} from 'discord.js';
import { __ } from 'i18n';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { DChannelButton } from '../DChannelButton/DChannelButton';

const { error } = createLogger('UserButton');

const p0 = new QPoint(0, 0);

/**
 * Represents a button with user's avatar, name and current status.
 */
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

  private statusInd = new QLabel(this.avatar);

  private nameLayout = new QBoxLayout(Direction.LeftToRight);

  private statusIcon = new QLabel(this);

  private statusLabel = new QLabel(this);

  private statusLayout = new QBoxLayout(Direction.LeftToRight);

  private infoControls = new QBoxLayout(Direction.TopToBottom);

  user?: User;

  member?: GuildMember;

  isGuildMember = false;

  constructor(parent?: any) {
    super(parent);
    this.setProperty('type', 'user');
    this.setFixedSize(224, 42);
    this.setFlexNodeSizeControlled(false);
    this.initComponent();
  }

  /**
   * Binds discord.js events in order to update user infos dynamically.
   */
  static init() {
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;
      client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
        if (!presence.user) return;
        const btn = UserButton.buttons.get(presence.user);
        void btn?.loadPresence(presence);
      });
      client.on(Events.GUILD_MEMBER_UPDATE, (o, m) => {
        const oldMember = o as GuildMember;
        const member = m as GuildMember;
        const btn = UserButton.buttons.get(member);
        if (!btn) return;
        if (btn.isGuildMember) btn.loadUser(member); else btn.loadUser(member.user);
        if (oldMember.user.avatar !== member.user.avatar) void btn.loadAvatar();
      });
      client.on(Events.USER_UPDATE, (o, u) => {
        const oldUser = o as User;
        const user = u as User;
        const btn = UserButton.buttons.get(user);
        if (!btn || btn.isGuildMember) return;
        btn.loadUser(user);
        if (oldUser.avatar !== user.avatar) void btn.loadAvatar();
      });
    });
  }

  static createInstance(parent: any, someone: User | GuildMember) {
    const button = new UserButton(app.window);
    button.loadUser(someone);
    button.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    button.addEventListener('customContextMenuRequested', ({ x, y }) => {
      app.emit(AppEvents.OPEN_USER_MENU, someone, button.mapToGlobal(new QPoint(x, y)));
    });
    button.addEventListener('clicked', async () => {
      if (someone instanceof GuildMember) {
        const map = button.mapToGlobal(p0);
        map.setX(map.x() - 250);
        app.emit(AppEvents.OPEN_USER_PROFILE, someone.id, someone.guild.id, map);
      } else {
        app.emit(AppEvents.SWITCH_VIEW, 'dm', { dm: await someone.createDM() });
      }
    });
    return button;
  }

  private initComponent() {
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
    statusInd.setObjectName('StatusIndicator');
    statusInd.setFixedSize(16, 16);
    statusInd.setProperty('tooltip', 'Offline');
    statusInd.move(19, 19);
    nameLayout.setSpacing(6);
    nameLayout.addWidget(nameLabel);
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

  /**
   * Loads the image in the avatar.
   */
  async loadAvatar() {
    if (!app.config.enableAvatars || !this.user || this.hasPixmap) return;
    this.hasPixmap = true;
    try {
      const path = await pictureWorker.loadImage(
        this.user.displayAvatarURL({ format: 'png', size: 256 }),
      );
      if (this.native.destroyed) return;
      this.avatar.setPixmap(new QPixmap(path).scaled(32, 32, 1, 1));
    } catch (e) {
      this.hasPixmap = false;
      error(`Could not load avatar of user ${this.user.tag}`);
    }
  }

  /**
   * Renders current user's presence.
   * @param presence User presence.
   */
  async loadPresence(presence: Presence) {
    if (this.native.destroyed) return;
    this.statusInd.setProperty('tooltip', presence.status);
    this.statusInd.setInlineStyle(`background-color: ${PresenceStatusColor.get(presence.status)}`);
    void this.loadStatusEmoji(presence);

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

  /**
   * Renders custom status's emoji if it is set.
   * @param presence User's presence.
   */
  async loadStatusEmoji(presence: Presence) {
    this.statusIcon.hide();
    const activity = presence.activities.find((a) => !!a.emoji);
    if (!activity || !activity.emoji || !activity.emoji.name) return;
    try {
      const emojiPath = await resolveEmoji({
        emoji_id: activity.emoji.id || undefined,
        emoji_name: activity.emoji.name,
      });
      const pix = new QPixmap(emojiPath);
      this.statusIcon.setPixmap(pix.scaled(14, 14, 1, 1));
    } catch (e) {
      error(`Couldn't load status emoji for user ${this.user?.tag}, emoji ${activity.emoji}`);
    }
    this.statusIcon.show();
  }

  /**
   * Loads user/member data into the button.
   * @param someone User or member to render.
   */
  loadUser(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.isGuildMember = !!member;
    this.user = user;
    this.member = member || undefined;

    this.nameLabel.setText(member?.nickname ?? user.username);
    void this.loadPresence(user.presence);
    this.addEventListener(WidgetEventTypes.DeferredDelete, () => UserButton.buttons.delete(user));

    UserButton.buttons.set(user, this);
    if (member) UserButton.buttons.set(member, this);
  }
}
setTimeout(UserButton.init, 100);
