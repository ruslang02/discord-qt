import { QWidget, FlexLayout, QLabel, QPushButton, QIcon, QSize, QCursor, CursorShape, QPixmap, QBoxLayout, Direction } from "@nodegui/nodegui";
import path from 'path';
import './UserPanel.scss';
import { app } from "../..";
import { Client } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";

export class UserPanel extends QWidget {

  private avatar = new QLabel();
  private nameLabel = new QLabel();
  private discLabel = new QLabel();
  private settingsBtn = new QPushButton();
  private controls = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();

    this.initComponent();
    app.on('client', this.bindEvents.bind(this));
  }

  bindEvents(client: Client) {
    client.on('ready', this.updateData.bind(this));
    client.on('userUpdate', this.updateData.bind(this));
  }

  private initComponent() {
    const { avatar, nameLabel, discLabel, settingsBtn, controls } = this; 
    this.setLayout(controls);
    this.setObjectName('UserPanel');

    controls.setContentsMargins(8, 8, 8, 8)
    controls.setSpacing(8);

    avatar.setObjectName('UserAvatar');
    avatar.setFixedSize(32, 32);
    avatar.setPixmap(new QPixmap(path.join(__dirname, '../assets/icons/discord.png')).scaled(32, 32))

    const infoContainer = new QWidget();
    const infoControls = new QBoxLayout(Direction.TopToBottom);
    infoContainer.setLayout(infoControls);
    infoContainer.setObjectName('InfoContainer');
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0, 0, 0, 0);
    nameLabel.setText('No account');
    nameLabel.setObjectName('NameLabel');

    discLabel.setText('#0000');
    discLabel.setObjectName('DiscLabel');

    [nameLabel, discLabel]
      .forEach(w => infoControls.addWidget(w))

    const settingsIcon = new QIcon(path.resolve(__dirname, '../assets/icons/cog.png'));

    settingsBtn.setFixedSize(32, 32);
    settingsBtn.setObjectName('SettingsBtn');
    settingsBtn.setIcon(settingsIcon);
    settingsBtn.setIconSize(new QSize(20, 20));
    settingsBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    settingsBtn.setProperty('toolTip', 'User Settings');
    settingsBtn.setWindowOpacity(50);
    controls.addWidget(avatar, 0);
    controls.addWidget(infoContainer, 1);
    controls.addWidget(settingsBtn, 0);
  }

  async updateData(): Promise<void> {
    const { avatar, nameLabel, discLabel } = this;
    const { client } = app;
    if(!client?.user) {
      nameLabel.setText('No account');
      discLabel.setText('#0000');
      return;
    }

    let avatarBuf = await pictureWorker.loadImage(
      client.user.avatarURL || client.user.defaultAvatarURL,
      { size: 32, roundify: true }
    );

    if(avatarBuf !== null) {
      const avatarPixmap = new QPixmap();
      avatarPixmap.loadFromData(avatarBuf, 'PNG');
      avatar.setPixmap(avatarPixmap);
    }

    nameLabel.setText(client.user.username);
    discLabel.setText(`#${client.user.discriminator}`);
  }
}