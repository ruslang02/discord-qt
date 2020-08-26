import { QWidget, QLabel, QBoxLayout, Direction, QPixmap } from '@nodegui/nodegui';
import { Presence } from 'discord.js';
import { MAX_QSIZE } from '../..';
import { pictureWorker } from '../../utilities/PictureWorker';

export class ProfilePresence extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private header = new QLabel(this);
  private label1 = new QLabel(this);
  private label2 = new QLabel(this);
  private label3 = new QLabel(this);
  private lImage = new QLabel(this);

  constructor(parent?: any) {
    super(parent);

    this.initComponent();
    this.setObjectName(this.constructor.name);
  }

  private initComponent() {
    const { layout, header, label1, label2, label3, lImage } = this;
    header.setObjectName('Header');
    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(8);
    [label1, label2, label3].forEach(label => label.setObjectName('Label'));
    const dLayout = new QBoxLayout(Direction.LeftToRight);
    dLayout.setContentsMargins(0, 0, 0, 0);
    dLayout.setSpacing(10);
    lImage.setMaximumSize(60, MAX_QSIZE);
    lImage.setMinimumSize(60, 0);

    const lLayout = new QBoxLayout(Direction.TopToBottom);
    lLayout.setContentsMargins(0, 0, 0, 0);
    lLayout.setSpacing(0);

    lLayout.addStretch(1);
    [label1, label2, label3].forEach(label => lLayout.addWidget(label));
    lLayout.addStretch(1);
    dLayout.addWidget(lImage);
    dLayout.addLayout(lLayout, 1);

    this.setLayout(layout);
    layout.addWidget(header);
    layout.addLayout(dLayout);
  }

  load(presence: Presence) {
    const { header, label1, label2, label3, lImage } = this;
    const activity = presence.activities.find(a => a.type !== 'CUSTOM_STATUS');
    if (!activity) {
      this.hide();
      return false;
    }
    switch (activity.type) {
      case 'LISTENING':
        header.setText(`Listening to ${activity.name}`);
        break;
      case 'PLAYING':
        header.setText('Playing a game');
        break;
      case 'WATCHING':
        header.setText(`Watching ${activity.name}`);
        break;
      case 'STREAMING':
        header.setText(`Streaming ${activity.name}`);
        break;
    }
    if (activity.type === 'PLAYING') {
      label1.setText(`<b>${activity.name}</b>`);
      label1.show();
      activity.details ? label2.show() : label2.hide();
      label2.setText(activity.details || '');
    } else {
      activity.details ? label1.show() : label1.hide();
      label1.setText(`<b>${activity.details}</b>`);
    }
    activity.state ? label3.show() : label3.hide();
    label3.setText(activity.state || '');

    const lImageUrl = activity.assets?.largeImageURL({size: 256, format: 'png'});
    if (lImageUrl) {
      pictureWorker.loadImage(lImageUrl, {roundify: false})
        .then(path => path && lImage.setPixmap(new QPixmap(path).scaled(60, 60, 1, 1)))
    } else {
      lImage.setText('');
      lImage.hide();
    }

    this.show();
    return true;
  }
}