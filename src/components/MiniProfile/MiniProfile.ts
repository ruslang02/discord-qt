import { QMenu, Direction, QBoxLayout, QWidget, WidgetAttribute, QLabel, QPixmap, AlignmentFlag, QAction, WidgetEventTypes, QPoint } from '@nodegui/nodegui';
import './MiniProfile.scss';
import { CustomStatusLabel } from './CustomStatusLabel';
import { MAX_QSIZE, app } from '../..';
import { GuildMember, User } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';
import { ProfilePresence } from './ProfilePresence';

export class MiniProfile extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);
  private root = new QWidget(this);
  private profile = new QWidget(this);
  private presence = new ProfilePresence(this);
  private avatar = new QLabel(this);
  private nickname = new QLabel(this);
  private username = new QLabel(this);
  private custom = new CustomStatusLabel();
  private adjustTimer?: NodeJS.Timer;
  private p0 = new QPoint(0, 0);

  constructor(parent?: any) {
    super(parent);

    this.setInlineStyle('background: transparent;');
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    (this.layout as QBoxLayout).addWidget(this.root, 1);
    (this.layout as QBoxLayout).setContentsMargins(0, 0, 0, 0);
    this.initComponent();
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.addEventListener(WidgetEventTypes.Show, () => {
      if (this.adjustTimer) clearInterval(this.adjustTimer);
      this.adjustTimer = setInterval(() => this.adjustSize(), 10);
    });
    this.addEventListener(WidgetEventTypes.Close, () => this.adjustTimer && clearInterval(this.adjustTimer));
  }

  popup(point: QPoint) {
    if(point.y() + this.size().height() > app.window.mapToGlobal(this.p0).y() + app.window.size().height())
      point.setY(point.y() - this.size().height());
    super.popup(point);
  }

  private initComponent() {
    const { controls, root, profile, presence } = this;
    
    root.setLayout(controls);
    root.setMinimumSize(250, 0);
    root.setMaximumSize(250, MAX_QSIZE);
    root.setObjectName('MiniProfile');
    controls.setContentsMargins(1, 1, 1, 1);
    controls.setSpacing(0);

    this.initProfile();
    controls.addWidget(profile);
    controls.addWidget(presence);
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
    nickname.setWordWrap(true);
    username.setObjectName('Username');
    username.setWordWrap(true);

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
      .then(path => path && avatar.setPixmap(new QPixmap(path).scaled(80, 80, 1, 1)))
    if (member?.nickname) {
      username.show();
      nickname.setText(member.nickname);
      username.setText(user.tag);
    } else {
      nickname.setText(user.tag);
      username.hide();
    }
    profile.setProperty('isPlaying', this.presence.load(user.presence) ? 'true' : 'false');
    profile.repolish();
    custom.loadStatus(user);
  }
}