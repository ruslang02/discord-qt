import { QLabel, QPixmap, QSize, QWidget } from '@nodegui/nodegui';
import { Client, Constants, DMChannel, GuildChannel, NewsChannel, TextChannel } from 'discord.js';
import { __ } from 'i18n';
import open from 'open';
import path from 'path';
import { app } from '../..';
import { Events as AppEvents } from '../../utilities/Events';
import { PresenceStatusColor } from '../../utilities/PresenceStatusColor';
import { ViewOptions } from '../../views/ViewOptions';
import { DIconButton } from '../DIconButton/DIconButton';
import { DLineEdit } from '../DLineEdit/DLineEdit';
import { DTitleBar } from '../DTitleBar/DTitleBar';

const { repository } = require('../../../package.json');

export class MainTitleBar extends DTitleBar {
  private channel?: TextChannel | NewsChannel | DMChannel;

  private userNameLabel = new QLabel();

  private statusLabel = new QLabel();

  private nicknamesBar = new QWidget();

  private iconLabel = new QLabel();

  private atPixmap = new QPixmap(path.join(__dirname, './assets/icons/at.png'));

  private poundPixmap = new QPixmap(path.join(__dirname, './assets/icons/pound.png'));

  constructor() {
    super();
    this.initComponent();
    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) {
        return;
      }

      if (view === 'dm' && options?.dm) {
        this.handleDMOpen(options.dm);
      } else if (view === 'guild' && options?.channel) {
        this.handleGuildOpen(options.channel);
      } else {
        this.channel = undefined;
        this.handleClear();
      }
    });

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;

      client.on(Events.PRESENCE_UPDATE, (_o, presence) => {
        if (this.channel?.type === 'dm' && this.channel.recipient.id === presence.userID) {
          this.updateStatus();
        }
      });
    });
  }

  private initComponent() {
    const { userNameLabel, statusLabel, nicknamesBar, controls: layout, iconLabel } = this;

    layout.setSpacing(6);
    layout.setContentsMargins(16, 12, 16, 12);

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');
    nicknamesBar.setObjectName('NicknamesBar');

    const searchEdit = new DLineEdit();

    searchEdit.setInlineStyle('width: 136px; height: 24px; margin-left: 4px; margin-right: 4px;');
    searchEdit.setPlaceholderText(__('SEARCH'));
    searchEdit.hide();

    const pinBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/pin.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: __('PINNED_MESSAGES'),
    });

    pinBtn.hide();

    const helpBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/help-circle.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: __('HELP'),
    });

    helpBtn.addEventListener('clicked', () => open(repository.url));

    layout.addWidget(iconLabel);
    layout.addWidget(userNameLabel);
    layout.addWidget(statusLabel);
    layout.addWidget(nicknamesBar, 1);
    layout.addWidget(pinBtn);
    layout.addWidget(searchEdit);
    layout.addWidget(helpBtn);
  }

  private updateStatus() {
    const { channel, statusLabel } = this;

    if (channel instanceof DMChannel) {
      statusLabel.setText('●');
      statusLabel.setInlineStyle(
        `color: ${PresenceStatusColor.get(channel.recipient.presence.status || 'offline')}`,
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
