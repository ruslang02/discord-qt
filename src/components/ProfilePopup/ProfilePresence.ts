import { AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget } from '@nodegui/nodegui';
import { ActivityType, Client, Presence } from 'discord.js';
import { __ } from '../../utilities/StringProvider';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events } from '../../utilities/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { PhraseID } from '../../utilities/PhraseID';

const { error } = createLogger('ProfilePresence');

/**
 * Represents currently playing section in the profile popup.
 */
export class ProfilePresence extends QWidget {
  private static ActivityTypeText: Map<ActivityType, PhraseID> = new Map([
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

  private sImage = new QLabel(this.lImage);

  private presence?: Presence;

  constructor(parent?: any) {
    super(parent);

    this.initComponent();
    this.setObjectName(this.constructor.name);
    app.on(Events.NEW_CLIENT, this.bindEvents.bind(this));
  }

  private bindEvents(client: Client) {
    client.on('presenceUpdate', (o, n) => {
      if (n.userID === this.presence?.userID) {
        this.load(this.presence);
      }
    });
  }

  private initComponent() {
    const { layout, header, label1, label2, label3, lImage, sImage } = this;

    header.setObjectName('Header');
    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(8);
    [label1, label2, label3].forEach((label) => label.setObjectName('Label'));
    const dLayout = new QBoxLayout(Direction.LeftToRight);

    dLayout.setContentsMargins(0, 0, 0, 0);
    dLayout.setSpacing(0);
    lImage.setMaximumSize(70, 65);
    lImage.setMinimumSize(70, 0);
    lImage.setObjectName('LargeImage');
    sImage.setObjectName('OverlayIcon');
    sImage.move(43, 41);
    sImage.setFixedSize(24, 24);
    sImage.setAlignment(AlignmentFlag.AlignCenter);

    const lLayout = new QBoxLayout(Direction.TopToBottom);

    lLayout.setContentsMargins(0, 0, 0, 0);
    lLayout.setSpacing(0);

    lLayout.addSpacing(3);
    [label1, label2, label3].forEach((label) => {
      label.setMaximumSize(MAX_QSIZE, 19);
      lLayout.addWidget(label);
    });

    lLayout.addSpacing(3);
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
    const { header, label1, label2, label3, lImage, sImage } = this;

    this.presence = presence;
    const activity = presence.activities.find((a) => a.type !== 'CUSTOM_STATUS');

    if (!activity) {
      this.hide();

      return false;
    }

    header.setText(
      __(ProfilePresence.ActivityTypeText.get(activity.type) as PhraseID, {
        name: activity.name,
        platform: activity.name,
      })
    );

    switch (activity.type) {
      case 'PLAYING':
        label1.setText(`<b>${activity.name}</b>`);
        label1.show();

        if (activity.details) {
          label2.show();
        } else {
          label2.hide();
        }

        label2.setText(activity.details || '');
        label3.hide();
        break;

      case 'LISTENING':
        if (activity.details) {
          label1.show();
        } else {
          label1.hide();
        }

        label1.setText(`<b>${activity.details}</b>`);

        if (activity.state) {
          label2.show();
        } else {
          label2.hide();
        }

        label2.setText(activity.state || '');

        if (activity.assets?.largeText) {
          label3.show();
        } else {
          label3.hide();
        }

        label3.setText(activity.assets?.largeText || '');
        break;

      default:
        if (activity.details) {
          label1.show();
        } else {
          label1.hide();
        }

        label1.setText(`<b>${activity.details}</b>`);

        if (activity.state) {
          label2.show();
        } else {
          label2.hide();
        }

        label2.setText(activity.state || '');
        label3.hide();
    }

    lImage.setProperty('toolTip', activity.assets?.largeText || '');
    sImage.setProperty('toolTip', activity.assets?.smallText || '');

    const lImageUrl = activity.assets?.largeImageURL({ size: 256, format: 'png' });

    if (lImageUrl) {
      pictureWorker
        .loadImage(lImageUrl, { roundify: false })
        .then((path) => lImage.setPixmap(new QPixmap(path).scaled(60, 60, 1, 1)))
        .catch(() => error(`Assets for ${activity.name} could not be loaded.`));
    } else {
      lImage.setText('');
      lImage.hide();
    }

    const sImageUrl = activity.assets?.smallImageURL({ size: 64, format: 'png' });

    if (sImageUrl) {
      pictureWorker
        .loadImage(sImageUrl, { roundify: true })
        .then((path) => sImage.setPixmap(new QPixmap(path).scaled(20, 20, 1, 1)))
        .catch(() => error(`Assets for ${activity.name} could not be loaded.`));
    } else {
      sImage.setText('');
      sImage.hide();
    }

    this.show();

    return true;
  }
}
