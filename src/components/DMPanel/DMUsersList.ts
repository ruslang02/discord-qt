import {
  ItemFlag,
  MatchFlag,
  QListWidget,
  QListWidgetItem,
  QPoint,
  QSize,
  ScrollBarPolicy,
  Shape,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  Client, Constants, DMChannel, SnowflakeUtil,
} from 'discord.js';
import { app } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { UserButton } from '../UserButton/UserButton';

export class DMUsersList extends QListWidget {
  channels = new Map<DMChannel, UserButton>();

  active?: UserButton;

  prevUpdate = (new Date()).getTime();

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('UsersContainer');
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.addEventListener(WidgetEventTypes.Paint, this.loadAvatars.bind(this));

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;
      client.on(Events.CLIENT_READY, this.loadDMs.bind(this));
      client.on(Events.MESSAGE_CREATE, (message) => {
        const dm = message.channel;
        if (dm.type !== 'dm') return;
        const btn = this.channels.get(dm);
        if (!btn) return;
        const items = this.findItems(dm.id, MatchFlag.MatchExactly);
        const newItem = new QListWidgetItem();
        newItem.setSizeHint(new QSize(224, 44));
        newItem.setFlags(~ItemFlag.ItemIsEnabled);
        newItem.setText(dm.id);
        const row = this.row(items[0]);
        this.insertItem(0, newItem);
        this.setItemWidget(newItem, btn);
        this.takeItem(row + 1);
      });
    });

    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view === 'guild') {
        this.active?.setActivated(false);
        this.active = undefined;
      }
      if (view !== 'dm' || !options || !options.dm) return;
      const button = this.channels.get(options.dm);
      this.active?.setActivated(false);
      button?.setActivated(true);
      this.active = button;
    });
  }

  private p0 = new QPoint(0, 0);

  private isLoading = false;

  async loadAvatars() {
    if (this.isLoading) return;
    const cDate = (new Date()).getTime();
    if (cDate - this.prevUpdate < 100) return;
    this.isLoading = true;
    const y = -this.mapToParent(this.p0).y();
    const height = this.size().height();
    for (const btn of this.channels.values()) {
      const iy = btn.mapToParent(this.p0).y();
      if (iy >= y - 100 && iy <= y + height + 100) btn.loadAvatar();
    }
    this.isLoading = false;
  }

  async filter(query?: string) {
    const q = (query || '').replace(/ /g, '').toLowerCase().trim();
    let i = 0;
    for (const btn of this.channels.values()) {
      if (!btn.user) return;
      const show = q !== '' ? btn.user.username.toLowerCase().replace(/ /g, '').includes(q) : true;
      this.setRowHidden(i, !show);
      i += 1;
    }
  }

  async loadDMs() {
    this.channels.clear();
    this.clear();
    // this.addDMLabel();

    const promises: Promise<void>[] = (app.client.channels.cache.array() as DMChannel[])
      .filter((c) => c.type === 'dm' && c.lastMessageID !== null)
      .sort((a, b) => {
        const snA = SnowflakeUtil.deconstruct(a.lastMessageID || '0');
        const snB = SnowflakeUtil.deconstruct(b.lastMessageID || '0');
        return snB.date.getTime() - snA.date.getTime();
      })
      .map((dm) => {
        const btn = new UserButton(this);
        const item = new QListWidgetItem();
        item.setSizeHint(new QSize(224, 44));
        item.setFlags(~ItemFlag.ItemIsEnabled);
        item.setText(dm.id);
        btn.addEventListener('clicked', () => app.emit(AppEvents.SWITCH_VIEW, 'dm', { dm }));
        this.channels.set(dm, btn);
        this.addItem(item);
        this.setItemWidget(item, btn);
        return btn.loadUser(dm.recipient);
      });
    await Promise.all(promises);
    setTimeout(() => this.loadAvatars(), 1000);
  }
}
