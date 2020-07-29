import { QLabel, QWidget, QPixmap, QBoxLayout, Direction, WidgetEventTypes } from "@nodegui/nodegui";
import { User, GuildMember } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";
import { DChannelButton } from '../DChannelButton/DChannelButton';
import './UserButton.scss';
import { CancelToken } from '../../utilities/CancelToken';
import { app } from '../..';

export class UserButton extends DChannelButton {
  private avatar = new QLabel(this);
  private infoContainer = new QWidget(this);
  private userNameLabel = new QLabel(this);
  private statusLabel = new QLabel(this);
  private infoControls = new QBoxLayout(Direction.TopToBottom);
  private user?: User;

  constructor(parent: any) {
    super(parent);
    this.setProperty('type', 'user');
    this.setFixedSize(224, 42);
    this.setFlexNodeSizeControlled(false);
    this.initComponent();
  }

  initComponent() {
    const { avatar, infoContainer, userNameLabel, statusLabel, layout, infoControls } = this;

    if (!app.config.enableAvatars) avatar.hide();
    avatar.setFixedSize(32, 32);
    avatar.setObjectName('Avatar');
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0, 0, 0, 0);
    infoContainer.setLayout(infoControls);
    userNameLabel.setObjectName('UserNameLabel');
    userNameLabel.setMinimumSize(24, 0);
    userNameLabel.setFlexNodeSizeControlled(false);
    statusLabel.setObjectName('StatusLabel');
    const labels = [userNameLabel, statusLabel];
    labels.forEach(w => infoControls.addWidget(w));
    layout.setSpacing(10);
    layout.addWidget(avatar, 0);
    layout.addWidget(infoContainer, 1);
    this.labels.push(...labels);

    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
    [avatar, infoContainer].forEach(w => this.layout?.addWidget(w));
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

  async loadUser(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;

    this.userNameLabel.setText(member?.nickname ?? user.username);
    this.statusLabel.setText(user.presence.status);

    this.user = user;
  }
}