import { Page } from './Page';
import { app, MAX_QSIZE } from '../../..';
import { QLabel, QWidget, QBoxLayout, Direction, QPixmap } from '@nodegui/nodegui';
import { pictureWorker } from '../../../utilities/PictureWorker';
import { Client, Constants } from 'discord.js';

import { DColorButton } from '../../../components/DColorButton/DColorButton';
import { Events } from '../../../structures/Events';
import { MarkdownStyles } from '../../../structures/MarkdownStyles';
import { __ } from 'i18n';
import { DLabel } from '../../../components/DLabel/DLabel';

export class MyAccountPage extends Page {
  title = __('ACCOUNT');

  constructor() {
    super();
    this.initPage();
    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on(Constants.Events.CLIENT_READY, this.loadUser.bind(this));
    });
  }

  private loadUser() {
    this.unabel.setText(app.client.user?.tag || '');
    this.emabel.setText(app.client.user?.email || "");
    pictureWorker.loadImage(
      app.client.user?.avatarURL({ size: 256, format: 'png' }) ||
      app.client.user?.defaultAvatarURL
    ).then(path => path && this.avatar.setPixmap(new QPixmap(path).scaled(100, 100, 1, 1)));
  }

  private unabel = new QLabel(this);
  private emabel = new QLabel(this);
  private avatar = new QLabel(this);

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
    unbold.setText(__('USERNAME'));
    unbold.setObjectName('Bold');
    unabel.setObjectName('Normal');
    const embold = new QLabel();
    embold.setText(__('EMAIL'));
    embold.setObjectName('Bold');
    emabel.setObjectName('Normal');
    infout.addWidget(unbold);
    infout.addWidget(unabel);
    infout.addStretch(20);
    infout.addWidget(embold);
    infout.addWidget(emabel);
    const editet = new QWidget();
    editet.setLayout(new QBoxLayout(Direction.TopToBottom));
    const editbn = new DColorButton();
    editbn.setText(__('EDIT'));
    editbn.setMinimumSize(60, 32)
    editbn.setMinimumSize(MAX_QSIZE, 32);
    (editet.layout as QBoxLayout).addWidget(editbn);
    (editet.layout as QBoxLayout).addStretch(1);
    cardLayout.addWidget(avatar);
    cardLayout.addWidget(info, 1);
    cardLayout.addWidget(editet);

    const twoFAHeader = new QLabel();
    twoFAHeader.setObjectName('Header2');
    twoFAHeader.setText(__('TWO_FA'));

    const twoFAHelper = new DLabel(this);
    twoFAHelper.setText(__('TWO_FA_UNAVAILABLE', {
      tfaURL: 'https://discord.com/channels/@me'
    }));
    twoFAHelper.setObjectName('TextLabel');

    layout.addWidget(header);
    layout.addWidget(card, 0);
    layout.addSpacing(20);
    layout.addWidget(twoFAHeader);
    layout.addWidget(twoFAHelper);
    layout.addStretch(1);
  }
}