import { QLabel, QWidget, QPixmap, FlexLayout, QCursor, CursorShape } from "@nodegui/nodegui";
import { User } from "discord.js";
import './UserButton.scss';
import { pictureWorker } from "../../utilities/PictureWorker";

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
    avatar.setFixedSize(36 + 10, 36);
    avatar.setObjectName('Avatar');

    infoContainer.setLayout(new FlexLayout());
    infoContainer.setObjectName('InfoContainer');

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');

    [userNameLabel, statusLabel].forEach(w => infoContainer.layout?.addWidget(w));
    [avatar, infoContainer].forEach(w => this.layout?.addWidget(w));
  }

  async loadUser(user: User) {
    const { userNameLabel, statusLabel } = this;
    pictureWorker.loadImage(user.avatarURL || user.defaultAvatarURL)
      .then(async (buffer) => {
        if (buffer === null)
          return;
        const avatarPixmap = new QPixmap();
        avatarPixmap.loadFromData(buffer, 'PNG');
        this.avatar.setPixmap(avatarPixmap.scaled(36, 36));
      });

    userNameLabel.setText(user.username);
    statusLabel.setText(user.presence.status);
  }
}