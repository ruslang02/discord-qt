import { QLabel, QPixmap, QSize, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { Client, Constants, DMChannel, GuildChannel, NewsChannel, TextChannel } from 'discord.js';
import open from 'open';
import path from 'path';
import { app } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { ConfigManager } from '../../utilities/ConfigManager';
import { Events as AppEvents } from '../../utilities/Events';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { __ } from '../../utilities/StringProvider';
import { ViewOptions } from '../../views/ViewOptions';
import { DIconButton } from '../DIconButton/DIconButton';
import { DLineEdit } from '../DLineEdit/DLineEdit';
import { DTitleBar } from '../DTitleBar/DTitleBar';

const { repository } = require('../../../package.json');

export class MainTitleBar extends DTitleBar {
  private channel?: TextChannel | NewsChannel | DMChannel | GroupDMChannel;

  private userNameLabel = new QLabel();

  private statusLabel = new QLabel();

  private nicknamesBar = new QWidget();

  private iconLabel = new QLabel();

  private atPixmap = new QPixmap(path.join(__dirname, './assets/icons/at.png'));

  private poundPixmap = new QPixmap(path.join(__dirname, './assets/icons/pound.png'));

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

  constructor() {
    super();
    this.initComponent();
    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) {
        return;
      }

      if (view === 'dm' && !(options?.dm instanceof GroupDMChannel)) {
        this.membersBtn.hide();
      } else {
        this.membersBtn.show();
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
      statusLabel,
      nicknamesBar,
      controls,
      iconLabel,
      drawerBtn,
      pinBtn,
      membersBtn,
      helpBtn,
    } = this;

    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(AppEvents.TOGGLE_DRAWER, false);
    });

    controls.setSpacing(6);
    controls.setContentsMargins(16, 12, 16, 12);

    userNameLabel.setObjectName('UserNameLabel');
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

    membersBtn.addEventListener('clicked', () => {
      const checked = !app.config.get('hideMembersList');

      app.config.set('hideMembersList', checked);
      void app.config.save();
    });

    membersBtn.hide();

    helpBtn.addEventListener('clicked', () => open(repository.url));

    controls.addWidget(drawerBtn);
    controls.addWidget(iconLabel);
    controls.addWidget(userNameLabel);
    controls.addWidget(statusLabel);
    controls.addWidget(nicknamesBar, 1);
    controls.addWidget(pinBtn);
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

  private handleClear() {
    const { userNameLabel, statusLabel, iconLabel } = this;

    iconLabel.hide();
    userNameLabel.setText('');
    statusLabel.hide();
  }

  private handleDMOpen(channel: DMChannel) {
    const { userNameLabel, statusLabel, iconLabel, atPixmap } = this;

    this.channel = channel;
    iconLabel.setPixmap(atPixmap);
    iconLabel.show();
    userNameLabel.setText(channel.recipient.username);
    statusLabel.show();
    this.updateStatus();
  }

  private handleGDMOpen(channel: GroupDMChannel) {
    const { userNameLabel, statusLabel, iconLabel, accountPixmap } = this;

    this.channel = channel;
    iconLabel.setPixmap(accountPixmap);
    iconLabel.show();
    userNameLabel.setText(channel.name);
    statusLabel.hide();
    this.updateStatus();
  }

  private handleGuildOpen(channel: GuildChannel) {
    const { userNameLabel, statusLabel, iconLabel, poundPixmap } = this;

    if (channel.type !== 'text' && channel.type !== 'news') {
      return;
    }

    this.channel = channel as TextChannel | NewsChannel;
    iconLabel.setPixmap(poundPixmap);
    iconLabel.show();
    userNameLabel.setText(channel.name);
    statusLabel.hide();
    this.updateStatus();
  }
}
