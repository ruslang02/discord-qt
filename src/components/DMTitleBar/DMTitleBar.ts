import { QWidget, FlexLayout, QIcon, QLabel, QIconMode, QIconState, QPixmap } from '@nodegui/nodegui';
import path from 'path';
import { app } from '../..';
import { Client, DMChannel } from 'discord.js';

const PresenceStatusColor = new Map([
  ['online', '#43b581'],
  ['dnd', '#f04747'],
  ['idle', '#faa61a'],
  ['offline', 'rgb(116, 127, 141)']
])

export class DMTitleBar extends QWidget {
  userNameLabel = new QLabel();
  statusLabel = new QLabel();
  nicknamesBar = new QWidget();
  constructor() {
    super();

    this.setObjectName('DMTitleBar');
    this.setLayout(new FlexLayout());
    this.initComponent();
    app.on('dmOpen', this.handleDMOpen.bind(this));
  }

  private initComponent() {
    const { userNameLabel, statusLabel, nicknamesBar } = this;

    const atLabel = new QLabel();
    atLabel.setPixmap(new QPixmap(path.join(__dirname, '../assets/icons/at.png')));

    userNameLabel.setObjectName('UserNameLabel');
    statusLabel.setObjectName('StatusLabel');
    nicknamesBar.setObjectName('NicknamesBar');
  }

  private handleDMOpen(channel: DMChannel) {
    const { userNameLabel, statusLabel } = this;

    userNameLabel.setText(channel.recipient.username);
    statusLabel.setText(channel.recipient.presence.status);
    statusLabel.setInlineStyle(`color: ${PresenceStatusColor.get(channel.recipient.presence.status)}`);

  }
}