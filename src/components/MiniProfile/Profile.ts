import {
  AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget,
} from '@nodegui/nodegui';
import { GuildMember, User } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';
import { CustomStatusLabel } from './CustomStatusLabel';

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
    const {
      layout, avatar, nickname, username, custom, unreadInd,
    } = this;

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

  setPlaying(value: boolean) {
    this.setProperty('isPlaying', value ? 'true' : 'false');
  }

  async loadProfile(someone: User | GuildMember) {
    const {
      avatar, username, nickname, custom, unreadInd,
    } = this;
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.setMinimumSize(250, 0);
    unreadInd.setProperty('color', user.presence.status);
    unreadInd.repolish();
    avatar.clear();
    pictureWorker.loadImage(user.displayAvatarURL({ format: 'png', size: 256 }))
      .then((path) => avatar.setPixmap(new QPixmap(path).scaled(80, 80, 1, 1)));
    if (member?.nickname) {
      username.show();
      nickname.setText(member.nickname);
      username.setText(user.tag);
    } else {
      nickname.setText(user.tag);
      username.hide();
    }
    this.repolish();
    custom.loadStatus(user);
  }
}
