import { QPushButton, QLabel, QWidget, QPixmap, FlexLayout, QCursor, CursorShape } from "@nodegui/nodegui";
import { User } from "discord.js";
import { httpsGet } from "../../utilities/HttpsGet";
import { app } from "../..";
import { roundifyPng } from "../../utilities/RoundifyPng";
import './UserButton.scss';

export class UserButton extends QWidget {
  avatar = new QLabel();
  infoContainer = new QWidget();
  userNameLabel = new QLabel();
  statusLabel = new QLabel();

  constructor() {
    super();
    this.setObjectName('UserButton');
    this.setLayout(new FlexLayout());
    this.initComponent();
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
  }

  initComponent() {
    const { avatar, infoContainer, userNameLabel, statusLabel } = this;
    avatar.setFixedSize(32 + 10, 32);
    avatar.setObjectName('Avatar');

    infoContainer.setLayout(new FlexLayout());
    infoContainer.setObjectName('InfoContainer');

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');

    [userNameLabel, statusLabel].forEach(w => infoContainer.layout?.addWidget(w));
    [avatar, infoContainer].forEach(w => this.layout?.addWidget(w));
  }

  setAvatar(buf: Buffer) {
    const avatarPixmap = new QPixmap();
    avatarPixmap.loadFromData(buf, 'PNG');
    this.avatar.setPixmap(avatarPixmap.scaled(32, 32));
  }

  async loadUser(user: User) {
    const { userNameLabel, statusLabel } = this;
    httpsGet(user.avatarURL || user.defaultAvatarURL)
      .then(async (imageBuffer) => {
        if (imageBuffer === false)
          return;
        if (!app.config.roundifyAvatars)
          return this.setAvatar(imageBuffer);

        const avatarBuf = await roundifyPng(imageBuffer);
        if (avatarBuf === false)
          return;
        this.setAvatar(avatarBuf);
      });

    userNameLabel.setText(user.username);
    statusLabel.setText(user.presence.status);
  }
}