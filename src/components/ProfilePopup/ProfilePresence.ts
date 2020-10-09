import {
  Direction, QBoxLayout, QLabel, QPixmap, QWidget,
} from '@nodegui/nodegui';
import { ActivityType, Presence } from 'discord.js';
import { __ } from 'i18n';
import { MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';

const { error } = createLogger('ProfilePresence');

/**
 * Represents currently playing section in the profile popup.
 */
export class ProfilePresence extends QWidget {
  private static ActivityTypeText: Map<ActivityType, string> = new Map([
    ['LISTENING', 'USER_ACTIVITY_HEADER_LISTENING'],
    ['PLAYING', 'USER_ACTIVITY_HEADER_PLAYING'],
    ['WATCHING', 'USER_ACTIVITY_HEADER_WATCHING'],
    ['STREAMING', 'USER_ACTIVITY_HEADER_LIVE_ON_PLATFORM'],
  ]);

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
    const {
      layout, header, label1, label2, label3, lImage,
    } = this;
    header.setObjectName('Header');
    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(8);
    [label1, label2, label3].forEach((label) => label.setObjectName('Label'));
    const dLayout = new QBoxLayout(Direction.LeftToRight);
    dLayout.setContentsMargins(0, 0, 0, 0);
    dLayout.setSpacing(10);
    lImage.setMaximumSize(60, MAX_QSIZE);
    lImage.setMinimumSize(60, 0);

    const lLayout = new QBoxLayout(Direction.TopToBottom);
    lLayout.setContentsMargins(0, 0, 0, 0);
    lLayout.setSpacing(0);

    lLayout.addStretch(1);
    [label1, label2, label3].forEach((label) => lLayout.addWidget(label));
    lLayout.addStretch(1);
    dLayout.addWidget(lImage);
    dLayout.addLayout(lLayout, 1);

    this.setLayout(layout);
    layout.addWidget(header);
    layout.addLayout(dLayout);
  }

  /**
   * Displays currently playing game by the user.
   * @param presence User presence to render.
   */
  load(presence: Presence) {
    const {
      header, label1, label2, label3, lImage,
    } = this;
    const activity = presence.activities.find((a) => a.type !== 'CUSTOM_STATUS');
    if (!activity) {
      this.hide();
      return false;
    }
    header.setText(__(
      ProfilePresence.ActivityTypeText.get(activity.type) || '',
      {
        name: activity.name,
        platform: activity.name,
      },
    ));
    if (activity.type === 'PLAYING') {
      label1.setText(`<b>${activity.name}</b>`);
      label1.show();
      if (activity.details) label2.show(); else label2.hide();
      label2.setText(activity.details || '');
    } else {
      if (activity.details) label1.show(); else label1.hide();
      label1.setText(`<b>${activity.details}</b>`);
    }
    if (activity.state) label3.show(); else label3.hide();
    label3.setText(activity.state || '');

    const lImageUrl = activity.assets?.largeImageURL({ size: 256, format: 'png' });
    if (lImageUrl) {
      pictureWorker.loadImage(lImageUrl, { roundify: false })
        .then((path) => lImage.setPixmap(new QPixmap(path).scaled(60, 60, 1, 1)))
        .catch(() => error(`Assets for ${activity.name} could not be loaded.`));
    } else {
      lImage.setText('');
      lImage.hide();
    }

    this.show();
    return true;
  }
}
