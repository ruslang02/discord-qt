import {
  ContextMenuPolicy,
  Direction,
  QBoxLayout,
  QLabel,
  QPixmap,
  QPoint,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  ActivityType,
  Client,
  Constants,
  DMChannel,
  GuildMember,
  Presence,
  User,
} from 'discord.js';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { PhraseID } from '../../utilities/PhraseID';
import { pictureWorker } from '../../utilities/PictureWorker';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { __ } from '../../utilities/StringProvider';
import { DMButton } from '../DMButton/DMButton';

const { error } = createLogger('UserButton');

const p0 = new QPoint(0, 0);

/**
 * Represents a button with user's avatar, name and current status.
 */
export class UserButton extends DMButton {
  private static ActivityTypeText: Map<ActivityType, PhraseID> = new Map([
    ['LISTENING', 'LISTENING_TO'],
    ['PLAYING', 'PLAYING_GAME'],
    ['WATCHING', 'WATCHING'],
    ['STREAMING', 'STREAMING'],
  ]);

  private static buttons = new Map<User | GuildMember, UserButton>();

  private hasPixmap = false;

  private statusInd = new QLabel(this.avatar);

  private statusIcon = new QLabel();

  private statusLayout = new QBoxLayout(Direction.LeftToRight);

  user?: User;

  member?: GuildMember;

  isGuildMember = false;

  constructor(parent?: any) {
    super(parent);

    this.initUserComponent();
  }

  static deleteInstance(someone: User | GuildMember) {
    UserButton.buttons.delete(someone);
  }

  /**
   * Binds discord.js events in order to update user infos dynamically.
   */
  static init() {
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;

      client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
        if (!presence.user) {
          return;
        }

        const btn = UserButton.buttons.get(presence.user);

        void btn?.loadPresence(presence);
      });

      client.on(Events.GUILD_MEMBER_UPDATE, (o, m) => {
        const oldMember = o as GuildMember;
        const member = m as GuildMember;
        const btn = UserButton.buttons.get(member);

        if (!btn) {
          return;
        }

        if (btn.isGuildMember) {
          btn.loadUser(member);
        } else {
          btn.loadUser(member.user);
        }

        if (oldMember.user.avatar !== member.user.avatar) {
          void btn.loadAvatar();
        }
      });

      client.on(Events.USER_UPDATE, (o, u) => {
        const oldUser = o as User;
        const user = u as User;
        const btn = UserButton.buttons.get(user);

        if (!btn || btn.isGuildMember) {
          return;
        }

        btn.loadUser(user);

        if (oldUser.avatar !== user.avatar) {
          void btn.loadAvatar();
        }
      });
    });

    setInterval(() => {
      for (const [user, button] of UserButton.buttons.entries()) {
        if (button.native.destroyed) {
          UserButton.buttons.delete(user);
        }
      }
    }, 1000);
  }

  static createInstance(parent: any, someone: User | GuildMember) {
    const button = new UserButton(parent);

    function handleContextMenu({ x, y }: { x: number; y: number }) {
      app.emit(AppEvents.OPEN_USER_MENU, someone, button.mapToGlobal(new QPoint(x, y)));
    }

    function handleClick() {
      if (someone instanceof GuildMember) {
        const map = button.mapToGlobal(p0);

        map.setX(map.x() - 250);
        app.emit(AppEvents.OPEN_USER_PROFILE, someone.id, someone.guild.id, map);
      } else {
        app.emit(AppEvents.SWITCH_VIEW, 'dm', { dm: someone.dmChannel as DMChannel });
      }
    }

    button.loadUser(someone);
    button.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    button.addEventListener('customContextMenuRequested', handleContextMenu);

    button.addEventListener(WidgetEventTypes.DeferredDelete, () => {
      UserButton.buttons.delete(someone);
    });

    button.addEventListener('clicked', handleClick);

    return button;
  }

  // initComponent is called by DMButton, we need a different name
  private initUserComponent() {
    const { infoControls, statusLabel, statusLayout, statusIcon, statusInd } = this;

    statusIcon.setMinimumSize(0, 0);
    statusInd.setObjectName('StatusIndicator');
    statusInd.setFixedSize(16, 16);
    statusInd.setProperty('tooltip', 'Offline');
    statusInd.move(19, 19);
    statusLayout.setSpacing(4);
    statusLayout.addWidget(statusIcon);
    statusLayout.addWidget(statusLabel, 1);

    infoControls.addLayout(statusLayout);

    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
  }

  get name() {
    return this.user?.username ?? '';
  }

  /**
   * Loads the image in the avatar.
   */
  async loadAvatar() {
    if (!app.config.get('enableAvatars') || !this.user || this.hasPixmap) {
      return;
    }

    this.hasPixmap = true;

    try {
      const path = await pictureWorker.loadImage(
        this.user.displayAvatarURL({ format: 'png', size: 256 })
      );

      this.setAvatar(path);
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
    if (this.native.destroyed) {
      return;
    }

    this.statusInd.setProperty('tooltip', presence.status);
    this.statusInd.setInlineStyle(`background-color: ${PresenceStatusColor.get(presence.status)}`);
    void this.loadStatusEmoji(presence);

    let status = '';

    if (presence.activities.length) {
      const { type, name, state } = presence.activities[0];

      this.statusIcon.setMaximumSize(MAX_QSIZE, MAX_QSIZE);

      if (type === 'CUSTOM_STATUS') {
        status = state || '';
      } else {
        status = __(UserButton.ActivityTypeText.get(type) as PhraseID, { name, game: name });
      }
    } else {
      this.statusIcon.setMaximumSize(MAX_QSIZE, 0);
    }

    this.setStatus(status);
  }

  /**
   * Renders custom status's emoji if it is set.
   * @param presence User's presence.
   */
  async loadStatusEmoji(presence: Presence) {
    if (this.native.destroyed) {
      return;
    }

    this.statusIcon.hide();
    const activity = presence.activities.find((a) => !!a.emoji);

    if (!activity || !activity.emoji || !activity.emoji.name) {
      return;
    }

    try {
      const emojiPath = await resolveEmoji({
        emoji_id: activity.emoji.id || undefined,
        emoji_name: activity.emoji.name,
      });

      if (this.native.destroyed) {
        return;
      }

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

    if (!user) {
      return;
    }

    this.isGuildMember = !!member;
    this.user = user;
    this.member = member || undefined;

    this.setName(member?.nickname ?? user.username);
    void this.loadPresence(user.presence);

    UserButton.buttons.set(user, this);

    if (member) {
      UserButton.buttons.set(member, this);
    }
  }

  delete() {
    if (this.member) {
      UserButton.buttons.delete(this.member);
    } else if (this.user) {
      UserButton.buttons.delete(this.user);
    }
  }
}
setTimeout(UserButton.init, 100);
