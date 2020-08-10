import { QMenu, Direction, QBoxLayout, QWidget, WidgetAttribute, QLabel, QPixmap, AlignmentFlag, QAction } from '@nodegui/nodegui';
import './MiniProfile.scss';
import { CustomStatusLabel } from './CustomStatusLabel';
import { MAX_QSIZE } from '../..';
import { GuildMember, User } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';

export class MiniProfile extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);
  private root = new QWidget(this);
  private profile = new QWidget(this);
  private presence = new QWidget(this);
  private avatar = new QLabel(this);
  private nickname = new QLabel(this);
  private username = new QLabel(this);
  private custom = new CustomStatusLabel();

  constructor(parent?: any) {
    super(parent);

    this.setInlineStyle('background: transparent;');
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    (this.layout as QBoxLayout).addWidget(this.root, 1);
    (this.layout as QBoxLayout).setContentsMargins(0, 0, 0, 0);
    this.initComponent();
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
  }

  private initComponent() {
    const { controls, root, profile } = this;
    
    root.setLayout(controls);
    root.setMinimumSize(250, 0);
    root.setMaximumSize(250, MAX_QSIZE);
    root.setObjectName('MiniProfile');
    controls.setContentsMargins(1, 1, 1, 1);
    controls.setSpacing(0);

    this.initProfile();
    controls.addWidget(profile)
  }

  private initProfile() {
    const { profile, avatar, nickname, username, custom } = this;
    profile.setObjectName('Profile');

    const layout = new QBoxLayout(Direction.TopToBottom);
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
    username.setObjectName('Username');

    profile.setLayout(layout);
  }

  async loadProfile(someone: User | GuildMember) {
    const { profile, avatar, username, nickname, custom } = this;
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    if (!user) return;
    this.setMinimumSize(250, 0);
    avatar.clear();
    pictureWorker.loadImage(user.avatarURL({ format: 'png', size: 256 }))
      .then(path => {
        if (!path) return;
        avatar.setPixmap(new QPixmap(path).scaled(80, 80, 1, 1));
      })
    if (member?.nickname) {
      username.show();
      nickname.setText(member.nickname);
      username.setText(`${user.username}#${user.discriminator}`);
    } else {
      nickname.setText(`${user.username}#${user.discriminator}`);
      username.hide();
    }
    custom.loadStatus(user);
  }
}