import { QWidget, QLabel, QSize, QPixmap, QBoxLayout, Direction, QPushButton, QCursor, CursorShape, QMenu, QAction, QIcon } from "@nodegui/nodegui";
import { Client, Constants, Presence, Activity, CustomStatus, PresenceData } from "discord.js";
import path, { join } from 'path';
import { app, MAX_QSIZE } from "../..";
import { pictureWorker } from "../../utilities/PictureWorker";
import { DIconButton } from "../DIconButton/DIconButton";
import { Events } from "../../structures/Events";
import { PresenceStatusColor } from '../../structures/PresenceStatusColor';
import './UserPanel.scss';
import { CustomStatusDialog } from '../../dialogs/CustomStatusDialog';
import { resolveEmoji } from '../../utilities/ResolveEmoji';

export class UserPanel extends QWidget {
  private avatar = new QLabel(this);
  private nameLabel = new QLabel(this);
  private discLabel = new QLabel(this);
  private statusIcon = new QLabel(this);
  private statusText = new QLabel(this);
  private statusBtn = new QPushButton(this);
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
    const { Events: DiscordEvents } = Constants;
    this.nameLabel.setText('Connecting...');
    this.discLabel.setText('#0000');
    client.on(DiscordEvents.CLIENT_READY, () => {
      this.updateData();
      this.updateAvatar();
      this.updatePresence();
    });
    client.on(DiscordEvents.USER_UPDATE, (prev, cur) => {
      this.updateData();
      if (prev.avatar !== cur.avatar) this.updateAvatar();
    });
    client.on(DiscordEvents.PRESENCE_UPDATE, (_o, presence) => {
      if (presence.userID === client.user?.id)
        this.updatePresence();
    });
    client.on(DiscordEvents.USER_SETTINGS_UPDATE, () => {
      this.updatePresence();
    });
  }

  private initComponent() {
    const { avatar, nameLabel, discLabel, controls, statusBtn, statusIcon, statusText } = this;
    this.setLayout(controls);
    this.setObjectName('UserPanel');
    this.setMinimumSize(0, 52);
    this.setMaximumSize(MAX_QSIZE, 52);

    controls.setContentsMargins(8, 8, 8, 8)
    controls.setSpacing(0);

    avatar.setObjectName('UserAvatar');
    avatar.setFixedSize(32, 32);

    const layInfo = new QBoxLayout(Direction.TopToBottom);
    layInfo.setSpacing(0);
    layInfo.setContentsMargins(8, 0, 0, 0);
    nameLabel.setText('No account');
    nameLabel.setObjectName('NameLabel');

    const layStat = new QBoxLayout(Direction.LeftToRight);
    layStat.setSpacing(4);
    layStat.setContentsMargins(0, 0, 0, 0);

    discLabel.setText('#0000');
    discLabel.setObjectName('DiscLabel');
    statusText.setObjectName('DiscLabel');

    layStat.addWidget(discLabel, 1);
    layStat.addWidget(statusIcon);
    layStat.addWidget(statusText, 1);

    statusIcon.hide();
    statusText.hide();

    layInfo.addWidget(nameLabel);
    layInfo.addLayout(layStat);

    const statusMenu = new QMenu();

    ['Custom Status...', null, 'Online', 'Idle', 'Do Not Disturb', 'Invisible'].forEach(text => {
      const action = new QAction();
      action.addEventListener('triggered', async () => {
        // if (!app.client) return;
        const status = text === 'Do Not Disturb' ? 'dnd': text?.toLowerCase();
        if (text === 'Custom Status...') {
          app.window.dialogs.customStatus.show();
          return;
        }
        // @ts-ignore
        await app.client.user?.setPresence({ status });
        this.updatePresence();
      })
      if (text === null) action.setSeparator(true);
      else {
        action.setText(text);
        action.setIcon(new QIcon(join(__dirname, 'assets', 'icons', `status-${text.toLowerCase().replace(/ /g, '-')}.png`)));
      }
      statusMenu.addAction(action);
    });
    statusBtn.setText('●');
    statusBtn.setObjectName('DIconButton');
    statusBtn.setProperty('tooltip', 'Offline');
    statusBtn.setFixedSize(32, 32);
    statusBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    statusBtn.addEventListener('clicked', () => statusBtn.showMenu());
    statusBtn.setMenu(statusMenu);

    const iBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/invite.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: 'Accept Invite Code'
    });
    iBtn.setFixedSize(32, 32);
    iBtn.addEventListener('clicked', () => app.window.dialogs.acceptInvite.show());

    const setBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/cog.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: 'User Settings'
    });
    setBtn.setFixedSize(32, 32);
    setBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'settings'));
    controls.addWidget(avatar, 0);
    controls.addLayout(layInfo, 1);
    controls.addWidget(statusBtn, 0);
    controls.addWidget(iBtn, 0);
    controls.addWidget(setBtn, 0);
  }

  async updateData(): Promise<void> {
    const { nameLabel, discLabel, statusBtn } = this;
    const { client } = app;
    if (!client.user) {
      nameLabel.setText('No account');
      discLabel.setText('#0000');
      statusBtn.setInlineStyle('');
      return;
    }
    nameLabel.setText(client.user.username);
    discLabel.setText(`#${client.user.discriminator}`);
  }

  async updateAvatar(): Promise<void> {
    const { client } = app;
    if (!client.user) return;
    let avatarBuf = await pictureWorker.loadImage(
      client.user.avatarURL({ format: 'png', size: 64 }) || client.user.defaultAvatarURL
    );

    if (avatarBuf !== null) {
      const avatarPixmap = new QPixmap();
      avatarPixmap.loadFromData(avatarBuf, 'PNG');
      this.avatar.setPixmap(avatarPixmap.scaled(32, 32, 1, 1));
    }
  }

  async loadStatusEmoji(status: CustomStatus) {
    this.statusIcon.hide();
    const emojiPath = await resolveEmoji(status);
    if (!emojiPath) return;
    const pix = new QPixmap(emojiPath);
    this.statusIcon.setPixmap(pix.scaled(14, 14, 1, 1));
    this.statusIcon.show();
  }

  async updatePresence() {
    const { avatar, nameLabel, discLabel, controls, statusBtn, statusIcon, statusText } = this;
    const user = app.client.user;
    if (!user) return;
    const { customStatus, presence } = user;

    if (!customStatus) {
      statusIcon.hide();
      statusText.hide();
      discLabel.show();
      return;
    }
    statusBtn.setInlineStyle(`color: ${PresenceStatusColor.get(presence.status)};`);
    statusBtn.setProperty('toolTip', presence.status);
    this.loadStatusEmoji(customStatus);
    this.statusText.setText(customStatus.text || '');

    statusText.show();
    discLabel.hide();
  }
}