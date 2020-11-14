import { AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget } from '@nodegui/nodegui';
import { GuildMember, User } from 'discord.js';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { CustomStatusLabel } from './CustomStatusLabel';

const { error } = createLogger('Profile');

/**
 * Represents the user info section in the profile popup.
 */
export class Profile extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private avatar = new QLabel(this);

  private nickname = new QLabel(this);

  private username = new QLabel(this);

  private unreadInd = new QLabel(this.avatar);

  private custom = new CustomStatusLabel();

  constructor(parent?: any) {
    super(parent);
    this.setObjectName('Profile');
    this.initComponent();
  }

  private initComponent() {
    const { layout, avatar, nickname, username, custom, unreadInd } = this;

    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(0);

    layout.addWidget(avatar);
    layout.addWidget(nickname);
    layout.addWidget(username);
    layout.addWidget(custom);

    unreadInd.setObjectName('StatusIndicator');
    unreadInd.setFixedSize(28, 28);
    unreadInd.setProperty('tooltip', 'Offline');
    unreadInd.move(124, 54);

    avatar.setAlignment(AlignmentFlag.AlignHCenter);
    nickname.setAlignment(AlignmentFlag.AlignHCenter);
    username.setAlignment(AlignmentFlag.AlignHCenter);

    avatar.setMinimumSize(0, 80);
    nickname.setObjectName('Nickname');
    nickname.setWordWrap(true);
    username.setObjectName('Username');
    username.setWordWrap(true);

    this.setLayout(layout);
  }

  /**
   * Styles the widget according to the user's playing state
   * @param value Whether user is currently playing.
   */
  setPlaying(value: boolean) {
    this.setProperty('isPlaying', value ? 'true' : 'false');
  }

  /**
   * Renders the widget according to the user.
   * @param someone User or member to process.
   */
  async loadProfile(someone: User | GuildMember) {
    const { avatar, username, nickname, custom, unreadInd } = this;
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) {
      return;
    }
    this.setMinimumSize(250, 0);
    unreadInd.setProperty('color', user.presence.status);
    unreadInd.repolish();
    avatar.clear();
    pictureWorker
      .loadImage(user.displayAvatarURL({ format: 'png', size: 256 }))
      .then((path) => avatar.setPixmap(new QPixmap(path).scaled(80, 80, 1, 1)))
      .catch(() => error(`Profile image for ${user.tag} could not be loaded.`));
    if (member?.nickname) {
      username.show();
      nickname.setText(`<span style='font-weight:600'>${member.nickname}</span>`);
      username.setText(user.tag);
    } else {
      nickname.setText(
        `<span style='font-weight:600'>${user.username}</span>#${user.discriminator}`,
      );
      username.hide();
    }
    this.repolish();
    void custom.loadStatus(user);
  }
}
