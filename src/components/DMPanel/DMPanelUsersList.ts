import { QWidget, QScrollArea, QLabel, QBoxLayout, Direction, WidgetEventTypes, Shape, QPoint } from "@nodegui/nodegui";
import { app } from "../..";
import { Client, DMChannel, SnowflakeUtil } from "discord.js";
import { UserButton } from "../UserButton/UserButton";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";

export class DMPanelUsersList extends QScrollArea {
  root = new QWidget();
  widgets = new QBoxLayout(Direction.TopToBottom);
  channels = new Map<DMChannel, UserButton>();
  active?: UserButton;

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('UsersContainer');

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      setTimeout(() => this.widgets.update());
      if (view !== 'dm' || !options || !options.dm) return;
      const button = this.channels.get(options.dm);
      this.active?.setActivated(false);
      button?.setActivated(true);
      this.active = button;
    });

    app.on(Events.READY, () => {
      app.window.addEventListener(WidgetEventTypes.Resize, this.loadAvatars.bind(this));
    });
  }

  private initRoot() {
    if (this.contentWidget) this.takeWidget();
    this.root = new QWidget();
    this.widgets = new QBoxLayout(Direction.TopToBottom);
    this.root.setLayout(this.widgets);
    this.root.setObjectName('UsersList');
    this.root.addEventListener(WidgetEventTypes.Scroll, this.loadAvatars.bind(this));
    this.root.addEventListener(WidgetEventTypes.Wheel, this.loadAvatars.bind(this));
    const dmLabel = new QLabel(this.root);
    dmLabel.setText('Direct Messages');
    dmLabel.setObjectName('DMLabel');
    this.widgets.addWidget(dmLabel);
    this.widgets.addStretch(1);
    this.widgets.setSpacing(2);
    this.widgets.setContentsMargins(8, 8, 8, 8);
    this.setWidget(this.root);
  }

  private p0 = new QPoint(0, 0);
  async loadAvatars() {
    const y = -this.root.mapToParent(this.p0).y() - 10;
    const skip = Math.ceil(y / 42);
    const height = this.size().height();
    const amount = Math.ceil(height / 42);
    const buttons = [...this.channels.values()];
    for (let i = skip; i < skip + amount && i < buttons.length; i++) buttons[i].loadAvatar();
    /* This is more accurate but requires a working layout.
    const y = -this.root.mapToParent(this.p0).y();
    const height = this.size().height();
    for (const btn of [...this.channels.values()]) {
      const iy = btn.mapToParent(this.p0).y();
      if (iy >= y - 100 && iy <= y + height + 100) btn.loadAvatar();
      if (iy > y + height) return;
    }*/
  }

  async loadDMs() {
    this.channels.clear();
    this.initRoot();

    const promises: Promise<void>[] =
      (app.client.channels.cache.array() as DMChannel[])
        .filter(c => c.type === 'dm' && c.lastMessageID !== null)
        .sort((a, b) => {
          const snA = SnowflakeUtil.deconstruct(a.lastMessageID || '0');
          const snB = SnowflakeUtil.deconstruct(b.lastMessageID || '0');
          return snB.date.getTime() - snA.date.getTime();
        })
        .map((dm, i) => {
          const btn = new UserButton(this.root);
          btn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'dm', { dm }));
          this.channels.set(dm, btn);
          this.widgets.insertWidget(i + 1, btn);
          return btn.loadUser(dm.recipient)
        });
    await Promise.all(promises);
    this.widgets.update();
    setTimeout(() => this.loadAvatars(), 1000);
  }
}