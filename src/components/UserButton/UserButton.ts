import { QLabel, QWidget, QPixmap, FlexLayout, QCursor, CursorShape, QBoxLayout, Direction, AspectRatioMode, TransformationMode, WidgetEventTypes, WidgetAttribute, QPushButton } from "@nodegui/nodegui";
import { User } from "discord.js";
import './UserButton.scss';
import { pictureWorker } from "../../utilities/PictureWorker";

export class UserButton extends QPushButton {
  private avatar = new QLabel();
  private infoContainer = new QWidget();
  private userNameLabel = new QLabel();
  private statusLabel = new QLabel();
  private controls = new QBoxLayout(Direction.LeftToRight);
  private infoControls = new QBoxLayout(Direction.TopToBottom);

  private _hovered = false;
  private _activated = false;

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
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0,0,0,0);
    infoContainer.setLayout(infoControls);
    infoContainer.setObjectName('InfoContainer');
    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');
    const labels = [userNameLabel, statusLabel];
    labels.forEach(w => infoControls.addWidget(w));
    controls.setSpacing(10);
    controls.setContentsMargins(8, 5, 8, 5);
    controls.addWidget(avatar, 0);
    controls.addWidget(infoContainer, 1);

    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));

    [avatar, infoContainer].forEach(w => this.layout?.addWidget(w));
  }

  private hovered() { return this._hovered; }

  private setHovered(hovered: boolean) {
    this._hovered = hovered;
    this.setProperty('hover', hovered);
    this.repolish();
    this.userNameLabel.repolish();
    this.statusLabel.repolish();
  }

  activated() { return this._activated; }

  setActivated(activated: boolean) {
    this._activated = activated;
    this.setProperty('active', activated);
    this.repolish();
    this.userNameLabel.repolish();
    this.statusLabel.repolish();
  }

  async loadUser(user: User) {
    const { userNameLabel, statusLabel } = this;
    pictureWorker.loadImage(user.avatarURL || user.defaultAvatarURL, {size: 128})
      .then(async (buffer) => {
        if (buffer === null)
          return;
        const avatarPixmap = new QPixmap();
        avatarPixmap.loadFromData(buffer, 'PNG');
        this.avatar.setPixmap(avatarPixmap.scaled(32, 32, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation));
      });

    userNameLabel.setText(user.username);
    userNameLabel.setMinimumSize(24, 0);
    userNameLabel.setFlexNodeSizeControlled(false);
    userNameLabel.adjustSize();
    statusLabel.setText(user.presence.status);
  }
}