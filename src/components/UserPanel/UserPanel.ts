import {
  CursorShape,
  Direction,
  QApplication,
  QBoxLayout,
  QClipboardMode,
  QCursor,
  QLabel,
  QPixmap,
  QPoint,
  QSize,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Client, Constants, DQConstants } from 'discord.js';
import { join } from 'path';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { CustomStatus } from '../../utilities/CustomStatus';
import { Events as AppEvents } from '../../utilities/Events';
import { PhraseID } from '../../utilities/PhraseID';
import { pictureWorker } from '../../utilities/PictureWorker';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { __ } from '../../utilities/StringProvider';
import { DIconButton } from '../DIconButton/DIconButton';
import { UserPanelMenu } from './UserPanelMenu';

const { error } = createLogger('UserPanel');

/**
 * Represents current user's data panel in the bottom right of the UI.
 */
export class UserPanel extends QWidget {
  private avatar = new QLabel(this);

  private nameLabel = new QLabel(this);

  private discLabel = new QLabel(this);

  private statusIcon = new QLabel(this);

  private statusText = new QLabel(this);

  private statusCircle = new QLabel(this.avatar);

  private controls = new QBoxLayout(Direction.LeftToRight);

  private clipboard = QApplication.clipboard();

  constructor() {
    super();

    this.initComponent();
    app.on(AppEvents.NEW_CLIENT, this.bindEvents.bind(this));
    app.on(AppEvents.READY, () => {
      if (!app.config.get('enableAvatars')) {
        this.avatar.hide();
      }
    });

    app.on(AppEvents.LOGIN_FAILED, () => {
      this.nameLabel.setText(__('ERROR'));
      this.discLabel.setText(__('NETWORK_ERROR_CONNECTION'));
      this.nameLabel.setInlineStyle('color: red');
    });
  }

  /**
   * Binds into discord.js to update user's info dynamically.
   * @param client discord.js Client to bind into.
   */
  private bindEvents(client: Client) {
    const { Events } = Constants as DQConstants;

    this.nameLabel.setText(__('CONNECTION_STATUS_CONNECTING'));
    this.discLabel.setText('#0000');
    this.nameLabel.setInlineStyle('');
    client.on(Events.CLIENT_READY, () => {
      void this.updateData();
      void this.updateAvatar();
      void this.updatePresence();
    });

    client.on(Events.USER_UPDATE, (prev, cur) => {
      void this.updateData();

      if (prev.avatar !== cur.avatar) {
        void this.updateAvatar();
      }
    });

    client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
      if (presence.userID === client.user?.id) {
        void this.updatePresence();
      }
    });

    client.on(Events.USER_SETTINGS_UPDATE, () => {
      void this.updatePresence();
    });
  }

  private copiedTimer?: any;

  private copiedAmount = 0;

  /**
   * Copies user tag into the clipboard.
   */
  private copyUserInfo() {
    const { clipboard, discLabel, statusText } = this;

    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }

    this.copiedAmount += 1;
    clipboard.setText(app.client.user?.tag || '', QClipboardMode.Clipboard);
    [discLabel, statusText].forEach((w) =>
      w.setText(__(`ACCOUNT_USERNAME_COPY_SUCCESS_${Math.min(this.copiedAmount, 11)}` as PhraseID))
    );

    this.copiedTimer = setTimeout(() => {
      void this.updateData();
      void this.updatePresence();
      this.copiedAmount = 0;
    }, 3000);
  }

  private initComponent() {
    const { avatar, nameLabel, discLabel, controls, statusCircle, statusIcon, statusText } = this;

    this.setLayout(controls);
    this.setObjectName('UserPanel');
    this.setMinimumSize(0, 52);
    this.setMaximumSize(MAX_QSIZE, 52);

    controls.setContentsMargins(8, 8, 8, 8);
    controls.setSpacing(0);

    avatar.setObjectName('UserAvatar');
    avatar.setFixedSize(32, 32);
    avatar.setCursor(new QCursor(CursorShape.PointingHandCursor));

    statusCircle.setObjectName('StatusCircle');
    statusCircle.setFixedSize(16, 16);
    statusCircle.setProperty('tooltip', 'Offline');
    statusCircle.move(18, 18);
    statusCircle.hide();

    const layInfo = new QBoxLayout(Direction.TopToBottom);

    layInfo.setSpacing(0);
    layInfo.setContentsMargins(8, 0, 0, 0);
    nameLabel.setText(__('NO_ACCOUNT'));
    nameLabel.setObjectName('NameLabel');

    const layStat = new QBoxLayout(Direction.LeftToRight);

    layStat.setSpacing(4);
    layStat.setContentsMargins(0, 0, 0, 0);

    discLabel.setText('#0000');
    discLabel.setObjectName('DiscLabel');
    statusText.setObjectName('DiscLabel');
    [nameLabel, discLabel, statusText].forEach((f) => {
      f.setCursor(CursorShape.PointingHandCursor);
      f.addEventListener(WidgetEventTypes.MouseButtonPress, this.copyUserInfo.bind(this));
    });

    layStat.addWidget(discLabel, 1);
    layStat.addWidget(statusIcon);
    layStat.addWidget(statusText, 1);

    statusIcon.hide();
    statusText.hide();

    layInfo.addWidget(nameLabel);
    layInfo.addLayout(layStat);

    const userMenu = new UserPanelMenu(this);

    userMenu.setObjectName('UserMenu');
    avatar.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      userMenu.adjustSize();
      const point = this.mapToGlobal(new QPoint(0, 0));

      point.setY(point.y() - userMenu.size().height() - 10);
      point.setX(point.x() + 10);
      userMenu.popup(point);
    });

    userMenu.addEventListener(WidgetEventTypes.Close, () => {
      setTimeout(this.updatePresence.bind(this), 500);
    });

    const iBtn = new DIconButton({
      iconPath: join(__dirname, './assets/icons/invite.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: __('INSTANT_INVITE_INVITE_CODE'),
    });

    iBtn.setFixedSize(32, 32);
    iBtn.addEventListener('clicked', () => app.window.dialogs.acceptInvite.show());

    const setBtn = new DIconButton({
      iconPath: join(__dirname, './assets/icons/cog.png'),
      iconQSize: new QSize(20, 20),
      tooltipText: __('USER_SETTINGS'),
    });

    setBtn.setFixedSize(32, 32);
    setBtn.addEventListener('clicked', () => app.emit(AppEvents.SWITCH_VIEW, 'settings'));
    controls.addWidget(avatar, 0);
    controls.addLayout(layInfo, 1);
    controls.addWidget(iBtn, 0);
    controls.addWidget(setBtn, 0);
  }

  /**
   * Updates user data shown on-screen.
   */
  async updateData(): Promise<void> {
    const { nameLabel, discLabel, statusCircle } = this;
    const { client } = app;

    if (!client.user) {
      nameLabel.setText(__('NO_ACCOUNT'));
      discLabel.setText('#0000');
      statusCircle.hide();

      return;
    }

    nameLabel.setText(client.user.username);
    discLabel.setText(`#${client.user.discriminator}`);
  }

  /**
   * Updates user's avatar.
   */
  async updateAvatar(): Promise<void> {
    const { avatar } = this;
    const { client } = app;

    if (!client.user) {
      return;
    }

    try {
      const path = await pictureWorker.loadImage(
        client.user.displayAvatarURL({ format: 'png', size: 256 })
      );

      avatar.setPixmap(new QPixmap(path).scaled(32, 32, 1, 1));
    } catch (e) {
      error("User's avatar could not be updated.");
    }
  }

  /**
   * Renders user's custom status emoji if it is set.
   * @param status User's custom status.
   */
  async loadStatusEmoji(status: CustomStatus) {
    try {
      const emojiPath = await resolveEmoji(status);

      if (this.native.destroyed) {
        return;
      }

      const pix = new QPixmap(emojiPath);

      this.statusIcon.setPixmap(pix.scaled(14, 14, 1, 1));
      this.statusIcon.show();
    } catch (e) {
      this.statusIcon.hide();
    }
  }

  /**
   * Updates user's custom status text and the status circle.
   */
  async updatePresence() {
    const { discLabel, statusCircle, statusIcon, statusText } = this;

    if (!app.client?.user) {
      return;
    }

    const { customStatus, presence } = app.client.user;

    statusCircle.setInlineStyle(`background-color: ${PresenceStatusColor.get(presence.status)};`);
    statusCircle.setProperty('toolTip', presence.status);
    statusCircle.show();

    if (!customStatus) {
      statusIcon.hide();
      statusText.hide();
      discLabel.show();

      return;
    }

    void this.loadStatusEmoji(customStatus);
    this.statusText.setText(customStatus.text || '');

    statusText.show();
    discLabel.hide();
  }
}
