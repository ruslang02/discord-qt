import { QWidget, QLabel, QBoxLayout, Direction, AlignmentFlag, QPixmap } from '@nodegui/nodegui';
import { CustomStatusLabel } from './CustomStatusLabel';
import { User, GuildMember } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';

export class Profile extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private avatar = new QLabel(this);
  private nickname = new QLabel(this);
  private username = new QLabel(this);
  private custom = new CustomStatusLabel();

  constructor(parent?: any) {
    super(parent);
    this.setObjectName('Profile');
    this.initComponent();
  }

  private initComponent() {
    const { layout, avatar, nickname, username, custom } = this;

    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(0);

    layout.addWidget(avatar);
    layout.addWidget(nickname);
    layout.addWidget(username);
    layout.addWidget(custom);

    avatar.setAlignment(AlignmentFlag.AlignHCenter);
    nickname.setAlignment(AlignmentFlag.AlignHCenter);
    username.setAlignment(AlignmentFlag.AlignHCenter);

    avatar.setMinimumSize(0, 80)
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
    const { avatar, username, nickname, custom } = this;
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.setMinimumSize(250, 0);
    avatar.clear();
    pictureWorker.loadImage(user.avatarURL({ format: 'png', size: 256 }))
      .then(path => path && avatar.setPixmap(new QPixmap(path).scaled(80, 80, 1, 1)))
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