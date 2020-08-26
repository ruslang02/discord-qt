import { QMenu, Direction, QBoxLayout, QWidget, WidgetAttribute, WidgetEventTypes, QPoint } from '@nodegui/nodegui';

import { MAX_QSIZE, app } from '../..';
import { GuildMember, User } from 'discord.js';
import { ProfilePresence } from './ProfilePresence';
import { Profile } from './Profile';
import { RolesSection } from './RolesSection';

export class MiniProfile extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);
  private root = new QWidget(this);
  private profile = new Profile(this);
  private presence = new ProfilePresence(this);
  private rolesSection = new RolesSection(this);
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

  async loadProfile(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    const isPlaying = this.presence.load(user.presence);
    this.profile.setPlaying(isPlaying);
    this.profile.loadProfile(someone);
    this.rolesSection.loadRoles(member?.roles)
  }

  private initComponent() {
    const { controls, root, profile, presence, rolesSection } = this;
    
    root.setLayout(controls);
    root.setMinimumSize(250, 0);
    root.setMaximumSize(250, MAX_QSIZE);
    root.setObjectName('MiniProfile');
    controls.setContentsMargins(1, 1, 1, 1);
    controls.setSpacing(0);

    controls.addWidget(profile);
    controls.addWidget(presence);
    controls.addWidget(rolesSection);
  }
}