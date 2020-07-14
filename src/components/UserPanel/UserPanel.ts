import { QWidget, FlexLayout, QLabel, QPushButton, QIcon, QSize, QCursor, CursorShape, QPixmap } from "@nodegui/nodegui";
import path from 'path';
import './UserPanel.scss';
import { app } from "../..";
import { httpsGet } from "../../utilities/HttpsGet";
import { roundifyPng } from "../../utilities/RoundifyPng";
import { Client } from "discord.js";

export class UserPanel extends QWidget {

  private avatar = new QLabel();
  private nameLabel = new QLabel();
  private discLabel = new QLabel();
  private settingsBtn = new QPushButton();

  constructor() {
    super();

    this.initComponent();
    app.on('clientNew', this.bindEvents.bind(this));
  }

  bindEvents(client: Client) {
    client.on('ready', this.updateData.bind(this));
    client.on('userUpdate', this.updateData.bind(this));
  }

  private initComponent() {
    const { avatar, nameLabel, discLabel, settingsBtn } = this; 
    this.setLayout(new FlexLayout());
    this.setObjectName('UserPanel');

    avatar.setObjectName('UserAvatar');
    avatar.setFixedSize(32 + 5, 32);
    avatar.setPixmap(new QPixmap(path.join(__dirname, '../assets/images/discord.png')).scaled(32, 32))

    const infoContainer = new QWidget();
    infoContainer.setLayout(new FlexLayout());
    infoContainer.setObjectName('InfoContainer');

    nameLabel.setText('No account');
    nameLabel.setObjectName('NameLabel');

    discLabel.setText('#0000');
    discLabel.setObjectName('DiscLabel');

    [nameLabel, discLabel]
      .forEach(w => infoContainer.layout?.addWidget(w))

    const settingsIcon = new QIcon(path.resolve(__dirname, '../assets/images/cog.png'));

    settingsBtn.setFixedSize(32+4, 32);
    settingsBtn.setObjectName('SettingsBtn');
    settingsBtn.setIcon(settingsIcon);
    settingsBtn.setIconSize(new QSize(20, 20));
    settingsBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));

    [avatar, infoContainer, settingsBtn]
      .forEach(w => this.layout?.addWidget(w));
  }

  async updateData(): Promise<void> {
    const { avatar, nameLabel, discLabel } = this;
    const { client } = app;
    if(!client?.user) {
      nameLabel.setText('No account');
      discLabel.setText('#0000');
      return;
    }

    let avatarBuf = await httpsGet(client.user.avatarURL || client.user.defaultAvatarURL);
    if(app.config.roundifyAvatars && avatarBuf !== false)
      avatarBuf = await roundifyPng(avatarBuf);
    if(avatarBuf !== false) {
      const avatarPixmap = new QPixmap();
      avatarPixmap.loadFromData(avatarBuf, 'PNG');
      avatar.setPixmap(avatarPixmap.scaled(32, 32));
    }

    nameLabel.setText(client.user.username);
    discLabel.setText(`#${client.user.discriminator}`);
  }
}