import {
  Direction, QBoxLayout, QMenu, QPoint, QWidget, WidgetAttribute, WidgetEventTypes,
} from '@nodegui/nodegui';
import { Snowflake, User } from 'discord.js';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../utilities/Events';
import { NoteSection } from './NoteSection';
import { Profile } from './Profile';
import { ProfilePresence } from './ProfilePresence';
import { RolesSection } from './RolesSection';

export class ProfilePopup extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);

  private root = new QWidget(this);

  private profile = new Profile(this);

  private presence = new ProfilePresence(this);

  private rolesSection = new RolesSection(this);

  private noteSection = new NoteSection(this);

  private adjustTimer?: any;

  private p0 = new QPoint(0, 0);

  private p?: QPoint;

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
    this.addEventListener(WidgetEventTypes.Resize, () => {
      if (!this.isVisible() || !this.p) return;
      this.realign(this.p);
    });

    app.on(Events.OPEN_USER_PROFILE, async (userId, guildId, point) => {
      this.loadProfile(userId, guildId);
      this.popup(point);
    });
  }

  private realign(p: QPoint) {
    const { window: w } = app;
    const tsize = this.size();
    const point = new QPoint(p.x(), p.y());
    const diff = w.mapToGlobal(this.p0).y() + w.size().height() - p.y() - tsize.height();
    if (diff < 0) {
      point.setY(point.y() + diff - 10);
    }
    this.move(point.x(), point.y());
    return point;
  }

  popup(p: QPoint) {
    this.p = p;
    super.popup(this.realign(p));
  }

  loadProfile(userId: Snowflake, guildId?: Snowflake) {
    const user = app.client.users.resolve(userId) as User;
    const member = guildId
      ? app.client.guilds.resolve(guildId)?.members.resolve(userId) || undefined
      : undefined;
    const isPlaying = this.presence.load(user.presence);
    this.profile.setPlaying(isPlaying);
    this.profile.loadProfile(member || user);
    this.rolesSection.loadRoles(member?.roles);
    this.noteSection.loadNote(user);
  }

  private initComponent() {
    const {
      controls, root, profile, presence, rolesSection, noteSection,
    } = this;

    root.setLayout(controls);
    root.setMinimumSize(250, 0);
    root.setMaximumSize(250, MAX_QSIZE);
    root.setObjectName('MiniProfile');
    controls.setContentsMargins(1, 1, 1, 1);
    controls.setSpacing(0);

    controls.addWidget(profile);
    controls.addWidget(presence);
    controls.addSpacing(8);
    controls.addWidget(rolesSection);
    controls.addWidget(noteSection);
  }
}
