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
import { Client, Constants, DMChannel, Message, SnowflakeUtil } from 'discord.js';
import { app } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { Events as AppEvents } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { GDMButton } from '../DMButton/GDMButton';
import { UserButton } from '../UserButton/UserButton';

export class DMUsersList extends QListWidget {
  channels = new Map<DMChannel | GroupDMChannel, UserButton | GDMButton>();

  active?: UserButton | GDMButton;

  private prevUpdate = new Date().getTime();

  private p0 = new QPoint(0, 0);

  private isLoading = false;

  constructor() {
    super();

    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('UsersContainer');
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.addEventListener(WidgetEventTypes.Paint, this.loadAvatars.bind(this));

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;

      client.on(Events.CLIENT_READY, this.loadDMs.bind(this));
      client.on(Events.MESSAGE_CREATE, this.handleNewMessage.bind(this));
    });

    app.on(AppEvents.SWITCH_VIEW, this.handleSwitchView.bind(this));
  }

  private handleNewMessage(message: Message) {
    const dm = message.channel as DMChannel | GroupDMChannel;

    if (['dm', 'group'].includes(dm.type)) {
      return;
    }

    const btn = this.channels.get(dm);

    if (!btn) {
      return;
    }

    const items = this.findItems(dm.id, MatchFlag.MatchExactly);

    if (!items.length) {
      return;
    }

    const newItem = new QListWidgetItem();

    newItem.setSizeHint(new QSize(224, 44));
    newItem.setFlags(~ItemFlag.ItemIsEnabled);
    newItem.setText(dm.id);
    this.insertItem(0, newItem);
    this.setItemWidget(newItem, btn);

    const row = this.row(items[0]);

    this.takeItem(row);
  }

  private handleSwitchView(view: string, options?: ViewOptions) {
    if (view === 'guild') {
      this.active?.setActivated(false);
      this.active = undefined;
    }

    if (view === 'dm' && options && options.dm) {
      const button = this.channels.get(options.dm);

      this.active?.setActivated(false);
      button?.setActivated(true);
      this.active = button;
    }
  }

  async loadAvatars() {
    if (this.isLoading || this.native.destroyed) {
      return;
    }

    const cDate = new Date().getTime();

    if (cDate - this.prevUpdate < 100) {
      return;
    }

    this.isLoading = true;

    const y = -this.mapToParent(this.p0).y();
    const height = this.size().height();
    const promises: Promise<void>[] = [];

    for (const btn of this.channels.values()) {
      const iy = btn.mapToParent(this.p0).y();

      if (iy >= y - 100 && iy <= y + height + 100) {
        promises.push(btn.loadAvatar());
      }
    }

    await Promise.all(promises);

    this.isLoading = false;
  }

  /**
   * Filter DM userlist by queried string
   * @param query String to search for
   */
  async filter(query?: string) {
    const q = (query || '').replace(/ /g, '').toLowerCase().trim();
    let i = 0;

    for (const btn of this.channels.values()) {
      const show = q === '' || btn.name.toLowerCase().replace(/ /g, '').includes(q);

      this.setRowHidden(i, !show);
      i += 1;
    }
  }

  async loadDMs() {
    this.channels.clear();
    this.clear();

    (app.client.channels.cache.array() as DMChannel[])
      .filter((c) => ['dm', 'group'].includes(c.type) && c.lastMessageID !== null)
      .sort((a, b) => {
        const snA = SnowflakeUtil.deconstruct(a.lastMessageID || '0');
        const snB = SnowflakeUtil.deconstruct(b.lastMessageID || '0');

        return snB.date.getTime() - snA.date.getTime();
      })
      .forEach((dm) => {
        let btn;

        if (dm instanceof GroupDMChannel) {
          btn = new GDMButton(dm, this);
        } else {
          btn = UserButton.createInstance(this, dm.recipient);
        }

        const item = new QListWidgetItem();

        item.setSizeHint(new QSize(224, 44));
        item.setFlags(~ItemFlag.ItemIsEnabled);
        item.setText(dm.id);
        this.channels.set(dm, btn);
        this.addItem(item);
        this.setItemWidget(item, btn);
      });

    void this.loadAvatars();
  }
}
