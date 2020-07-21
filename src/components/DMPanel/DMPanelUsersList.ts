import { QWidget, FlexLayout, QScrollArea, QLabel, QFont, QBoxLayout, Direction, QPushButton, WidgetEventTypes, Shape } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { Client, DMChannel, Collection, SnowflakeUtil } from "discord.js";
import { UserButton } from "../UserButton/UserButton";

export class DMPanelUsersList extends QScrollArea {
  root = new QWidget();
  widgets = new QBoxLayout(Direction.TopToBottom);
  channels = new Map<DMChannel, UserButton>();

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('UsersContainer');

    app.on('client', (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });

    app.on('dmOpen', (channel: DMChannel) => {
      this.channels.forEach((btn, dm) => btn.setActivated(dm.id === channel.id));
    });
    this.initRoot();
  }

  private initRoot() {
    this.takeWidget();
    this.root = new QWidget();
    this.widgets = new QBoxLayout(Direction.TopToBottom);
    this.root.setLayout(this.widgets);
    this.root.setObjectName('UsersList');
    const dmLabel = new QLabel();
    dmLabel.setText('Direct Messages'.toUpperCase());
    dmLabel.setObjectName('DMLabel');
    this.widgets.addWidget(dmLabel);
    this.widgets.addStretch(1);
    this.widgets.setSpacing(2);
    this.widgets.setContentsMargins(8, 8, 8, 8);
    this.setWidget(this.root);
  }

  async loadDMs() {
    const { client } = app;
    this.initRoot();

    const channels = (client.channels
      .filter(c => c.type === 'dm')
      .array() as DMChannel[])
      .filter(a => a.lastMessageID !== null)
      .sort((a, b) => {
        const snA = SnowflakeUtil.deconstruct(a.lastMessageID);
        const snB = SnowflakeUtil.deconstruct(b.lastMessageID);
        return snB.date.getTime() - snA.date.getTime();
      });
    if(app.config.fastLaunch)
      channels.length = 5;
    channels.map(c => {
      const dm = c as DMChannel;
      const uButton = new UserButton(this.root);
      uButton.loadUser(dm.recipient);
      uButton.setMinimumSize(0, 42);
      uButton.setMaximumSize(MAX_QSIZE, 42);
      uButton.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
        app.emit('dmOpen', dm);
      });
      this.channels.set(dm, uButton);
      return uButton;
    }).forEach((w, i) => this.widgets.insertWidget(i+1, w));
  }
}