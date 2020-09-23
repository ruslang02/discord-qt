import {
  Direction, QBoxLayout, QMenu, QPoint, QWidget, WidgetAttribute, WidgetEventTypes,
} from '@nodegui/nodegui';
import { GuildMember, User } from 'discord.js';
import { MAX_QSIZE } from '../..';
import { Profile } from './Profile';
import { ProfilePresence } from './ProfilePresence';
import { RolesSection } from './RolesSection';

export class MiniProfile extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);

  private root = new QWidget(this);

  private profile = new Profile(this);

  private presence = new ProfilePresence(this);

  private rolesSection = new RolesSection(this);

  private adjustTimer?: any;

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
    this.addEventListener(WidgetEventTypes.Close, () => { clearInterval(this.adjustTimer); });
  }

  /* Aligns menu to be opened up when there is no space in the bottom.
    popup(p: QPoint) {
      const { window } = app;
      const tsize = this.size();
      if (p.y() + tsize.height() > window.mapToGlobal(this.p0).y() + window.size().height()) {
        p.setY(p.y() - tsize.height());
      }
      super.popup(p);
    }
  */

  async loadProfile(someone: User | GuildMember) {
    const user = someone instanceof GuildMember ? someone.user : someone;
    const member = someone instanceof GuildMember ? someone : null;
    const isPlaying = this.presence.load(user.presence);
    this.profile.setPlaying(isPlaying);
    this.profile.loadProfile(someone);
    this.rolesSection.loadRoles(member?.roles);
  }

  private initComponent() {
    const {
      controls, root, profile, presence, rolesSection,
    } = this;

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
