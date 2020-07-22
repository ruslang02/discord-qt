import { QLabel, QWidget, QPixmap, QBoxLayout, Direction, WidgetEventTypes } from "@nodegui/nodegui";
import { User, GuildMember } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";
import { DChannelButton } from '../DChannelButton/DChannelButton';
import './UserButton.scss';

export class UserButton extends DChannelButton {
  private avatar = new QLabel();
  private infoContainer = new QWidget();
  private userNameLabel = new QLabel();
  private statusLabel = new QLabel();
  private infoControls = new QBoxLayout(Direction.TopToBottom);

  constructor(parent: any) {
    super(parent);
    this.initComponent();
  }

  initComponent() {
    const { avatar, infoContainer, userNameLabel, statusLabel, layout, infoControls } = this;
    avatar.setFixedSize(32, 32);
    avatar.setObjectName('Avatar');
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0,0,0,0);
    infoContainer.setLayout(infoControls);
    infoContainer.setObjectName('InfoContainer');
    userNameLabel.setInlineStyle('font-size: 16px;');
    userNameLabel.setMinimumSize(0, 40);
    statusLabel.setInlineStyle('font-size: 12px;');
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

  async loadUser(someone: User | GuildMember) {
    const { userNameLabel, statusLabel } = this;
    let user = someone instanceof GuildMember ? someone.user : someone;
    let member = someone instanceof GuildMember ? someone : null;
    pictureWorker.loadImage(
      user.avatarURL || user.defaultAvatarURL, {size: 32})
      .then(async (buffer) => {
        if (buffer === null)
          return;
        const avatarPixmap = new QPixmap();
        avatarPixmap.loadFromData(buffer, 'PNG');
        this.avatar.setPixmap(avatarPixmap/*.scaled(32, 32, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation)*/);
      });

    userNameLabel.setText(member?.nickname ?? user.username);
    userNameLabel.setMinimumSize(24, 0);
    userNameLabel.setFlexNodeSizeControlled(false);
    userNameLabel.adjustSize();
    statusLabel.setText(user.presence.status);
  }
}