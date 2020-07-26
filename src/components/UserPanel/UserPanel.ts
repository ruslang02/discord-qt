import { QWidget, QLabel, QSize, QPixmap, QBoxLayout, Direction } from "@nodegui/nodegui";
import path from 'path';
import './UserPanel.scss';
import { app, MAX_QSIZE } from "../..";
import { Client } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";
import { DIconButton } from "../DIconButton/DIconButton";
import { Events } from "../../structures/Events";

export class UserPanel extends QWidget {

  private avatar = new QLabel();
  private nameLabel = new QLabel();
  private discLabel = new QLabel();
  private controls = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();

    this.initComponent();
    app.on(Events.NEW_CLIENT, this.bindEvents.bind(this));
    app.on(Events.READY, () => {
      if (!app.config.enableAvatars) this.avatar.hide();
    });
  }

  bindEvents(client: Client) {
    this.nameLabel.setText('Connecting...');
    this.discLabel.setText('#0000');
    client.on('ready', this.updateData.bind(this));
    // client.on('userUpdate', this.updateData.bind(this));
  }

  private initComponent() {
    const { avatar, nameLabel, discLabel, controls } = this; 
    this.setLayout(controls);
    this.setObjectName('UserPanel');
    this.setMinimumSize(0, 52);
    this.setMaximumSize(MAX_QSIZE, 52);

    controls.setContentsMargins(8, 8, 8, 8)
    controls.setSpacing(8);

    avatar.setObjectName('UserAvatar');
    avatar.setFixedSize(32, 32);

    const infoContainer = new QWidget();
    const infoControls = new QBoxLayout(Direction.TopToBottom);
    infoContainer.setLayout(infoControls);
    infoContainer.setObjectName('InfoContainer');
    infoContainer.setMinimumSize(0, 32);
    infoContainer.setMaximumSize(MAX_QSIZE, 32);
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0, 0, 0, 0);
    nameLabel.setText('No account');
    nameLabel.setObjectName('NameLabel');

    discLabel.setText('#0000');
    discLabel.setObjectName('DiscLabel');

    [nameLabel, discLabel]
      .forEach(w => infoControls.addWidget(w))

    /*
    const iBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/invite.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: 'Accept Invite Code'
    });
    iBtn.setFixedSize(32, 32);
    iBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'invite'));
    */
    const sBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/cog.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: 'User Settings'
    });
    sBtn.setFixedSize(32, 32);
    sBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'settings'));
    controls.addWidget(avatar, 0);
    controls.addWidget(infoContainer, 1);
    controls.addWidget(sBtn, 0);
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
      client.user.avatarURL({format: 'png', size: 64}) || client.user.defaultAvatarURL
    );

    if(avatarBuf !== null) {
      const avatarPixmap = new QPixmap();
      avatarPixmap.loadFromData(avatarBuf, 'PNG');
      avatar.setPixmap(avatarPixmap.scaled(32, 32, 1, 1));
    }

    nameLabel.setText(client.user.username);
    discLabel.setText(`#${client.user.discriminator}`);
  }
}