import {
  QLabel,
  QLineEdit,
  QPixmap,
  QPoint,
  QSize,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Client, Constants, DMChannel, GuildChannel, NewsChannel, TextChannel } from 'discord.js';
import open from 'open';
import path from 'path';
import { app, MAX_QSIZE } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { ConfigManager } from '../../utilities/ConfigManager';
import { Events as AppEvents } from '../../utilities/Events';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { __ } from '../../utilities/StringProvider';
import { ViewOptions } from '../../views/ViewOptions';
import { DIconButton } from '../DIconButton/DIconButton';
import { DLineEdit } from '../DLineEdit/DLineEdit';
import { DTitleBar } from '../DTitleBar/DTitleBar';
import { RecipientPopup } from './RecipientPopup';

const { repository } = require('../../../package.json');

export class MainTitleBar extends DTitleBar {
  private channel?: TextChannel | NewsChannel | DMChannel | GroupDMChannel;

  private userNameLabel = new QLabel();

  private userNameInput = new QLineEdit();

  private statusLabel = new QLabel();

  private nicknamesBar = new QWidget();

  private iconLabel = new QLabel();

  private recipientPopup = new RecipientPopup(this);

  private atPixmap = new QPixmap(path.join(__dirname, './assets/icons/at.png'));

  private poundPixmap = new QPixmap(path.join(__dirname, './assets/icons/pound.png'));

  private p24 = new QPoint(24, 24);

  private accountPixmap = new QPixmap(
    path.join(__dirname, './assets/icons/account-multiple.png')
  ).scaled(24, 24, 1, 1);

  private drawerBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/menu.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: '',
    isCheckbox: true,
    checked: true,
  });

  private pinBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/pin.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('PINNED_MESSAGES'),
  });

  private membersBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/account-multiple.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('MEMBER_LIST'),
    isCheckbox: true,
    checked: false,
  });

  private helpBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/help-circle.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('HELP'),
  });

  private recipientBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/account-plus.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('ADD_RECIPIENT'),
  });

  constructor() {
    super();
    this.initComponent();
    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) {
        return;
      }

      this.membersBtn.show();
      this.recipientBtn.hide();

      if (view === 'dm') {
        if (options?.dm instanceof GroupDMChannel) {
          this.recipientBtn.show();
        } else {
          this.membersBtn.hide();
        }
      }

      if (view === 'dm' && options?.dm) {
        if (options.dm instanceof DMChannel) {
          this.handleDMOpen(options.dm);
        } else {
          this.handleGDMOpen(options.dm);
        }

        app.emit(AppEvents.TOGGLE_DRAWER, false);
      } else if (view === 'guild' && options?.channel) {
        this.handleGuildOpen(options.channel);
        app.emit(AppEvents.TOGGLE_DRAWER, false);
      } else {
        this.channel = undefined;
        this.handleClear();
      }
    });

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;

      client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
        if (this.channel instanceof DMChannel && this.channel.recipient.id === presence.userID) {
          this.updateStatus();
        }
      });

      this.handleConfigUpdate(app.config);
    });

    app.on(AppEvents.CONFIG_UPDATE, this.handleConfigUpdate.bind(this));

    app.on(AppEvents.TOGGLE_DRAWER, (value) => {
      this.drawerBtn.setChecked(value);
    });
  }

  private handleConfigUpdate(config: ConfigManager) {
    if (config.get('isMobile')) {
      this.helpBtn.hide();
      this.drawerBtn.show();
    } else {
      this.helpBtn.show();
      this.drawerBtn.hide();
    }

    this.membersBtn.setChecked(!config.get('hideMembersList'));
  }

  private initComponent() {
    const {
      userNameLabel,
      userNameInput,
      statusLabel,
      nicknamesBar,
      controls,
      iconLabel,
      drawerBtn,
      pinBtn,
      membersBtn,
      helpBtn,
      recipientBtn,
      recipientPopup,
    } = this;

    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(AppEvents.TOGGLE_DRAWER, false);
    });

    controls.setSpacing(6);
    controls.setContentsMargins(16, 12, 16, 12);

    userNameLabel.setObjectName('UserNameLabel');

    userNameInput.setObjectName('UserNameInput');
    userNameInput.setMinimumSize(0, 30);
    userNameInput.setMaximumSize(MAX_QSIZE, 30);

    statusLabel.setObjectName('StatusLabel');
    nicknamesBar.setObjectName('NicknamesBar');

    const searchEdit = new DLineEdit();

    searchEdit.setInlineStyle('width: 136px; height: 24px; margin-left: 4px; margin-right: 4px;');
    searchEdit.setPlaceholderText(__('SEARCH'));
    searchEdit.hide();

    drawerBtn.addEventListener('clicked', (value) => {
      app.emit(AppEvents.TOGGLE_DRAWER, value);
    });

    drawerBtn.setInlineStyle('margin: 0 15px 0 5px');

    pinBtn.hide();

    recipientBtn.addEventListener('clicked', () => {
      const map = recipientBtn.mapToGlobal(this.p24); // bottom right of icon

      map.setX(map.x() - recipientPopup.size().width());

      RecipientPopup.updateFriends();
      recipientPopup.popup(map);
    });

    recipientPopup.addEventListener(WidgetEventTypes.Hide, () => {
      recipientBtn.setIcon(recipientBtn.qiconOff); // Update icon when closing the popup
    });

    recipientBtn.hide();

    membersBtn.addEventListener('clicked', () => {
      const checked = !app.config.get('hideMembersList');

      app.config.set('hideMembersList', checked);
      void app.config.save();
    });

    membersBtn.hide();

    helpBtn.addEventListener('clicked', () => open(repository.url));

    controls.addWidget(drawerBtn);
    controls.addWidget(iconLabel);
    controls.addWidget(userNameInput);
    controls.addWidget(userNameLabel);
    controls.addWidget(statusLabel);
    controls.addWidget(nicknamesBar, 1);
    controls.addWidget(pinBtn);
    controls.addWidget(recipientBtn);
    controls.addWidget(membersBtn);
    controls.addWidget(searchEdit);
    controls.addWidget(helpBtn);
  }

  private updateStatus() {
    const { channel, statusLabel } = this;

    if (channel instanceof DMChannel) {
      statusLabel.setText('●');
      statusLabel.setInlineStyle(
        `color: ${PresenceStatusColor.get(channel.recipient.presence.status || 'offline')}`
      );
    }
  }

  private updateTitlebar(
    userLabel: string,
    readOnly?: boolean,
    channel?: MainTitleBar['channel'],
    pixmap?: QPixmap,
    showStatus?: boolean
  ) {
    const { userNameLabel, userNameInput, statusLabel, iconLabel } = this;

    // We need to wait for nodegui to implement QFontMetrics for a way to
    // dynamically set userNameInput width
    if (readOnly) {
      userNameInput.hide();
      userNameLabel.show();
      userNameLabel.setText(userLabel);
    } else {
      userNameLabel.hide();
      userNameInput.show();
      userNameInput.setText(userLabel);
    }

    this.channel = channel;

    if (pixmap) {
      iconLabel.setPixmap(pixmap);
      iconLabel.show();
    } else {
      iconLabel.hide();
    }

    if (showStatus) {
      statusLabel.show();
    } else {
      statusLabel.hide();
    }

    this.updateStatus();
  }

  private handleClear() {
    this.updateTitlebar('', true);
  }

  private handleDMOpen(channel: DMChannel) {
    const { atPixmap } = this;

    this.updateTitlebar(channel.recipient.username, true, channel, atPixmap, true);
  }

  private handleGDMOpen(channel: GroupDMChannel) {
    const { accountPixmap } = this;

    this.updateTitlebar(channel.name, false, channel, accountPixmap);
  }

  private handleGuildOpen(channel: GuildChannel) {
    const { poundPixmap } = this;

    if (!['text', 'news'].includes(channel.type)) {
      return;
    }

    this.updateTitlebar(channel.name, true, channel as TextChannel | NewsChannel, poundPixmap);
  }
}
