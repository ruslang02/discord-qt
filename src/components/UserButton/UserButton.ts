import { QLabel, QPixmap, QBoxLayout, Direction, WidgetEventTypes, AlignmentFlag } from "@nodegui/nodegui";
import { User, GuildMember, Presence, Client, Constants } from "discord.js";
import TWEmoji from 'twemoji';
import { pictureWorker } from "../../utilities/PictureWorker";
import { DChannelButton } from '../DChannelButton/DChannelButton';
import './UserButton.scss';
import { app, MAX_QSIZE } from '../..';
import { PresenceStatusColor } from '../../structures/PresenceStatusColor';
import { Events } from '../../structures/Events';

const buttons = new WeakMap<User, UserButton>();
setTimeout(() => {
  app.on(Events.NEW_CLIENT, (client: Client) => {
    const { Events: DiscordEvents } = Constants;
    client.on(DiscordEvents.PRESENCE_UPDATE, (_old, presence) => {
      if (!presence.user) return;
      const btn = buttons.get(presence.user);
      btn?.loadPresence(presence);
    });
  });
});

export class UserButton extends DChannelButton {
  private avatar = new QLabel(this);
  private nameLabel = new QLabel(this);
  private statusInd = new QLabel(this);
  private nameLayout = new QBoxLayout(Direction.LeftToRight);
  private statusIcon = new QLabel(this);
  private statusLabel = new QLabel(this);
  private statusLayout = new QBoxLayout(Direction.LeftToRight);
  private infoControls = new QBoxLayout(Direction.TopToBottom);
  private user?: User;

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
    pictureWorker.loadImage(
      this.user.avatarURL({ format: "png", size: 32 }) || this.user.defaultAvatarURL, { size: 32 })
      .then(async (buffer) => {
        if (buffer === null) return;
        const avatarPixmap = new QPixmap();
        avatarPixmap.loadFromData(buffer, 'PNG');
        this.avatar.setPixmap(avatarPixmap.scaled(32, 32, 1, 1));
      });
  }

  async loadPresence(presence: Presence) {
    this.statusInd.setInlineStyle(`color: ${PresenceStatusColor.get(presence.status)}`);
    this.loadStatusEmoji(presence);

    if (presence.activities.length) {
      const activity = presence.activities[0];
      [this.statusLabel, this.statusIcon].forEach(w => w.setMaximumSize(MAX_QSIZE, MAX_QSIZE));
      let status = '';

      switch (activity.type) {
        case 'LISTENING':
          status = `Listening to <b>${activity.name}</b>`;
          break;
        case 'PLAYING':
          status = `Playing <b>${activity.name}</b>`;
          break;
        case 'STREAMING':
          status = `Streaming <b>${activity.name}</b>`;
          break;
        case 'WATCHING':
          status = `Watching <b>${activity.name}</b>`;
          break;
        case 'CUSTOM_STATUS':
          status = activity.state || '';
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
    if (activity.emoji.name && !activity.emoji.id) {
      TWEmoji.parse(activity.emoji.name, {
        // @ts-ignore
        callback: async (icon, {base, size, ext}) => {
          const url = `${base}${size}/${icon}${ext}`;
          return this.dlStatusEmoji(url);
        }
      })
      return;
    }
    // @ts-ignore
    const emojiUrl = app.client.rest.cdn.Emoji(activity.emoji.id, 'png');
    return this.dlStatusEmoji(emojiUrl);
  }

  private async dlStatusEmoji(emojiUrl?: string) {
    if (!emojiUrl) return;
    const buf = await pictureWorker.loadImage(emojiUrl, { roundify: false, size: 16 })
    if (!buf) return;
    const pix = new QPixmap();
    pix.loadFromData(buf, 'PNG');
    this.statusIcon.setPixmap(pix.scaled(14, 14, 1, 1));
    this.statusIcon.show();
  }

  async loadUser(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.user = user;
    const { presence } = user;

    this.nameLabel.setText(member?.nickname ?? user.username);
    this.loadPresence(presence);
    buttons.set(user, this);
  }
}