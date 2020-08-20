import path from 'path';
import { QWidget, QLabel, QPixmap, QSize } from '@nodegui/nodegui';
import { DMChannel, Client, TextChannel, Constants } from 'discord.js';
import { app } from '../..';
import { DTitleBar } from '../DTitleBar/DTitleBar';
import { DLineEdit } from '../DLineEdit/DLineEdit';
import { DIconButton } from '../DIconButton/DIconButton';
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from '../../structures/Events';
import { PresenceStatusColor } from '../../structures/PresenceStatusColor';


export class MainTitleBar extends DTitleBar {
  private channel?: TextChannel | DMChannel;
  private userNameLabel = new QLabel();
  private statusLabel = new QLabel();
  private nicknamesBar = new QWidget();
  private iconLabel = new QLabel();
  private atPixmap = new QPixmap(path.join(__dirname, './assets/icons/at.png'));
  private poundPixmap = new QPixmap(path.join(__dirname, './assets/icons/pound.png'));

  constructor() {
    super();
    this.initComponent();
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) return;
      if (options?.dm) this.handleDMOpen(options.dm);
      else if (options?.channel) this.handleGuildOpen(options.channel)
      else {
        this.channel = undefined;
        this.handleClear();
      }
    });
    app.on(Events.NEW_CLIENT, (client: Client) => {
      const { Events: DiscordEvents } = Constants;
      client.on(DiscordEvents.PRESENCE_UPDATE, (_o, presence) => {
        if(this.channel?.type === 'dm' && this.channel.recipient.id === presence.userID) {
          this.updateStatus();
        }
      })
    })
    setInterval(() => this.raise(), 100);
  }

  private initComponent() {
    const { userNameLabel, statusLabel, nicknamesBar, controls: layout, iconLabel } = this;

    layout.setSpacing(6);
    layout.setContentsMargins(16, 12, 16, 12)

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');
    nicknamesBar.setObjectName('NicknamesBar');

    const searchEdit = new DLineEdit();
    searchEdit.setInlineStyle('width: 136px; height: 24px; margin-left: 4px; margin-right: 4px;');
    searchEdit.setPlaceholderText('Search');

    const pinBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/pin.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Pinned Messages'
    });

    const helpBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/help-circle.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Help'
    });

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
    if (channel instanceof TextChannel) return;
    statusLabel.setText(channel?.recipient.presence.status || "");
    statusLabel.setInlineStyle(`color: ${PresenceStatusColor.get(channel?.recipient.presence.status || 'offline')}`);
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

  private handleGuildOpen(channel: TextChannel) {
    const { userNameLabel, statusLabel, iconLabel, poundPixmap } = this;
    this.channel = channel;
    iconLabel.setPixmap(poundPixmap);
    iconLabel.show();
    userNameLabel.setText(channel.name);
    statusLabel.hide();
    this.updateStatus();
  }
}