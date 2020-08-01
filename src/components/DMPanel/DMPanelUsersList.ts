import { QWidget, QScrollArea, QLabel, QBoxLayout, Direction, WidgetEventTypes, Shape, QPoint, ScrollBarPolicy, QListWidget, QListWidgetItem, QSize, ItemFlag, QScrollBar } from "@nodegui/nodegui";
import { app } from "../..";
import { Client, DMChannel, SnowflakeUtil } from "discord.js";
import { UserButton } from "../UserButton/UserButton";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { ScrollMode, SelectionMode } from '@nodegui/nodegui/dist/lib/QtWidgets/QAbstractItemView';

export class DMPanelUsersList extends QListWidget {
  channels = new Map<DMChannel, UserButton>();
  active?: UserButton;
  prevUpdate = (new Date()).getTime();

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('UsersContainer');
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.addEventListener(WidgetEventTypes.Paint, this.loadAvatars.bind(this));

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'dm' || !options || !options.dm) return;
      const button = this.channels.get(options.dm);
      this.active?.setActivated(false);
      button?.setActivated(true);
      this.active = button;
    });
  }

  private addDMLabel() {
    const dmLabel = new QLabel(this);
    const dmItem = new QListWidgetItem();
    dmLabel.setText('Direct Messages');
    dmLabel.setObjectName('DMLabel');
    dmItem.setSizeHint(new QSize(0, 30));
    dmItem.setFlags(0)
    this.addItem(dmItem);
    this.setItemWidget(dmItem, dmLabel);
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
    for (const btn of [...this.channels.values()]) {
      const iy = btn.mapToParent(this.p0).y();
      if (iy >= y - 100 && iy <= y + height + 100) btn.loadAvatar();
    }
    this.isLoading = false;
  }

  async loadDMs() {
    this.channels.clear();
    this.clear();
    this.addDMLabel();

    const promises: Promise<void>[] =
      (app.client.channels.cache.array() as DMChannel[])
        .filter(c => c.type === 'dm' && c.lastMessageID !== null)
        .sort((a, b) => {
          const snA = SnowflakeUtil.deconstruct(a.lastMessageID || '0');
          const snB = SnowflakeUtil.deconstruct(b.lastMessageID || '0');
          return snB.date.getTime() - snA.date.getTime();
        })
        .map(dm => {
          const btn = new UserButton(this);
          const item = new QListWidgetItem();
          item.setSizeHint(new QSize(224, 44));
          item.setFlags(~ItemFlag.ItemIsEnabled)
          btn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'dm', { dm }));
          this.channels.set(dm, btn);
          this.addItem(item);
          this.setItemWidget(item, btn);
          return btn.loadUser(dm.recipient)
        });
    await Promise.all(promises);
    setTimeout(() => this.loadAvatars(), 1000);
  }
}