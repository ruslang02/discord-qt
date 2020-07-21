import { Page } from './Page';
import { app } from '../../..';
import { QLabel, QWidget, QBoxLayout, Direction, QPixmap } from '@nodegui/nodegui';
import { pictureWorker } from '../../../utilities/PictureWorker';
import { Client } from 'discord.js';
import './MyAccountPage.scss';

export class MyAccountPage extends Page {
  title = "My Account";

  constructor() {
    super();
    this.initPage();
    app.on('client', (client: Client) => {
      client.on('ready', this.loadUser.bind(this));
    });
  }

  private loadUser() {
    this.unabel.setText(`${app.client.user.username}#${app.client.user.discriminator}`);
    this.emabel.setText(app.client.user.email);
    pictureWorker.loadImage(app.client.user.avatarURL || app.client.user.defaultAvatarURL, {size: 128})
      .then(buffer => {
        if(!buffer) return;
        const avamap = new QPixmap();
        avamap.loadFromData(buffer);
        this.avatar.setPixmap(avamap.scaled(100, 100, 1, 1));
      });
  }

  unabel = new QLabel(this);
  emabel = new QLabel(this);
  avatar = new QLabel(this);

  private initPage() {
    const { layout, title, avatar, unabel, emabel } = this;
    const header = new QLabel();
    header.setObjectName('Header2');
    header.setText(title);

    const card = new QWidget(this);
    const cardLayout = new QBoxLayout(Direction.LeftToRight);
    cardLayout.setSpacing(20);
    cardLayout.setContentsMargins(20, 20, 20, 20);
    card.setLayout(cardLayout);
    card.setObjectName('MyAccountCard');
    avatar.setMinimumSize(100, 100);
    const info = new QWidget();
    const infout = new QBoxLayout(Direction.TopToBottom);
    infout.setContentsMargins(0, 2, 0, 2);
    infout.setSpacing(0);
    info.setLayout(infout);
    const unbold = new QLabel();
    unbold.setText('Username');
    unbold.setObjectName('Bold');
    unabel.setObjectName('Normal');
    const embold = new QLabel();
    embold.setText('Email');
    embold.setObjectName('Bold');
    emabel.setObjectName('Normal');
    infout.addWidget(unbold);
    infout.addWidget(unabel);
    infout.addStretch(1);
    infout.addWidget(embold);
    infout.addWidget(emabel);
    cardLayout.addWidget(avatar);
    cardLayout.addWidget(info, 1);

    const twoFAHeader = new QLabel();
    twoFAHeader.setObjectName('Header2');
    twoFAHeader.setText('Two-factor authentication');

    const twoFAHelper = new QLabel();
    twoFAHelper.setText(`This app cannot manage 2FA-authentication, however the official <a href='https://discord.com/channels/@me'>web app</a> can!`);
    twoFAHelper.setObjectName('TextLabel');
    twoFAHelper.setOpenExternalLinks(true);

    layout.addWidget(header);
    layout.addWidget(card, 0);
    layout.addSpacing(20);
    layout.addWidget(twoFAHeader);
    layout.addWidget(twoFAHelper);
    layout.addStretch(1);
  }
}