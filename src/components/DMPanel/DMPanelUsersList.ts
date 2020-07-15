import { QWidget, FlexLayout, QScrollArea, QLabel, QFont, QBoxLayout, Direction } from "@nodegui/nodegui";
import { app } from "../..";
import { Client, DMChannel, Collection, SnowflakeUtil } from "discord.js";
import { UserButton } from "../UserButton/UserButton";

export class DMPanelUsersList extends QScrollArea {
  root = new QWidget();
  widgets = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.root.setLayout(this.widgets);
    this.root.setObjectName('UsersList');
    this.setWidget(this.root);
    this.setObjectName('UsersContainer');

    const dmLabel = new QLabel();
    dmLabel.setText('Direct Messages'.toUpperCase());
    dmLabel.setObjectName('DMLabel');
    this.widgets.addWidget(dmLabel);
    this.widgets.addStretch(1);
    this.widgets.setSpacing(2);
    this.widgets.setContentsMargins(8, 8, 8, 8);

    app.on('client', (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });
  }

  async loadDMs() {
    const { client } = app;


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
      const uButton = new UserButton();
      uButton.loadUser(dm.recipient);
      uButton.setFixedSize(222, 42);
      return uButton;
    }).forEach((w, i) => this.widgets.insertWidget(i+1, w));
  }
}