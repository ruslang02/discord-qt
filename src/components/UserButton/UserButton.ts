import { QLabel, QWidget, QPixmap, FlexLayout, QCursor, CursorShape, QBoxLayout, Direction } from "@nodegui/nodegui";
import { User } from "discord.js";
import './UserButton.scss';
import { pictureWorker } from "../../utilities/PictureWorker";

export class UserButton extends QWidget {
  private avatar = new QLabel();
  private infoContainer = new QWidget();
  private userNameLabel = new QLabel();
  private statusLabel = new QLabel();
  private controls = new QBoxLayout(Direction.LeftToRight);
  private infoControls = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.setObjectName('UserButton');
    this.setLayout(this.controls);
    this.initComponent();
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
  }

  initComponent() {
    const { avatar, infoContainer, userNameLabel, statusLabel, controls, infoControls } = this;
    avatar.setFixedSize(32, 32);
    avatar.setObjectName('Avatar');
    infoControls.setSpacing(1);
    infoControls.setContentsMargins(0,0,0,0);
    infoContainer.setLayout(infoControls);
    infoContainer.setObjectName('InfoContainer');

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');

    [userNameLabel, statusLabel].forEach(w => infoContainer.layout?.addWidget(w));
    controls.setSpacing(10);
    controls.setContentsMargins(8, 5, 8, 5);
    controls.addWidget(avatar, 0);
    controls.addWidget(infoContainer, 1);

    [avatar, infoContainer].forEach(w => this.layout?.addWidget(w));
  }

  async loadUser(user: User) {
    const { userNameLabel, statusLabel } = this;
    pictureWorker.loadImage(user.avatarURL || user.defaultAvatarURL, {size: 32})
      .then(async (buffer) => {
        if (buffer === null)
          return;
        const avatarPixmap = new QPixmap();
        avatarPixmap.loadFromData(buffer, 'PNG');
        this.avatar.setPixmap(avatarPixmap);
      });

    userNameLabel.setText(user.username);
    statusLabel.setText(user.presence.status);
  }
}