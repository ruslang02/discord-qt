import { QWidget, FlexLayout, QScrollArea, QLabel, QFont, QBoxLayout, Direction, QPushButton, WidgetEventTypes, Shape, QWheelEvent, QPoint } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { Client, DMChannel, Collection, SnowflakeUtil } from "discord.js";
import { UserButton } from "../UserButton/UserButton";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { NativeRawPointer, NativeElement } from '@nodegui/nodegui/dist/lib/core/Component';

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
      if (view !== 'dm' || !options || !options.dm) return;
      const button = this.channels.get(options.dm);
      this.active?.setActivated(false);
      button?.setActivated(true);
      this.active = button;
    });
  }

  private handleWheel() {
    this.loadAvatars();
  }

  private initRoot() {
    if (this.contentWidget) this.takeWidget();
    this.root = new QWidget();
    this.widgets = new QBoxLayout(Direction.TopToBottom);
    this.root.setLayout(this.widgets);
    this.root.setObjectName('UsersList');
    this.root.addEventListener(WidgetEventTypes.Wheel, this.loadAvatars.bind(this))
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
    const y = -this.root.mapToParent(this.p0).y();
    const skip = Math.ceil(y / 42);
    const height = this.size().height();
    const amount = Math.ceil(height / 42);
    console.log({y, skip, height, amount});
    const buttons = [...this.channels.values()];
    for (let i = skip; i < skip + amount && i < buttons.length; i++) buttons[i].loadAvatar();
  }

  async loadDMs() {
    this.channels.clear();
    this.initRoot();

    const channels = (app.client.channels.cache
      .filter(c => c.type === 'dm')
      .array() as DMChannel[])
      .filter(a => a.lastMessageID !== null)
      .sort((a, b) => {
        const snA = SnowflakeUtil.deconstruct(a.lastMessageID || '0');
        const snB = SnowflakeUtil.deconstruct(b.lastMessageID || '0');
        return snB.date.getTime() - snA.date.getTime();
      });
    if (app.config.fastLaunch)
      channels.length = 5;
    channels.map(dm => {
      const btn = new UserButton(this.root);
      dm.fetch().then(() => btn.loadUser(dm.recipient));
      btn.addEventListener('clicked', () => {
        app.emit(Events.SWITCH_VIEW, 'dm', { dm });
      });
      this.channels.set(dm, btn);
      return btn;
    }).forEach((w, i) => this.widgets.insertWidget(i + 1, w));
    setTimeout(() => this.loadAvatars(), 100);
  }
}