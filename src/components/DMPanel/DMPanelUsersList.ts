import { QWidget, FlexLayout, QScrollArea, QLabel, QFont } from "@nodegui/nodegui";
import { app } from "../..";
import { Client, DMChannel, Collection } from "discord.js";
import { UserButton } from "../UserButton/UserButton";

export class DMPanelUsersList extends QScrollArea {
  root = new QWidget();

  constructor() {
    super();
    this.setLayout(new FlexLayout());
    this.root.setLayout(new FlexLayout());
    this.root.setObjectName('UsersList');
    this.setWidget(this.root);
    this.setObjectName('UsersContainer');

    const dmLabel = new QLabel();
    dmLabel.setText('Direct Messages'.toUpperCase());
    dmLabel.setObjectName('DMLabel');
    this.root.layout?.addWidget(dmLabel);

    app.on('clientNew', (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });
  }

  async loadDMs() {
    const { client } = app;


    const channels = (client.channels
      .filter(c => c.type === 'dm')
      .array() as DMChannel[])
      .sort((a, b) => +a.lastMessageID - +b.lastMessageID)
    channels.length = 5;

    channels.map(c => {
      const dm = c as DMChannel;
      const uButton = new UserButton();
      uButton.loadUser(dm.recipient);
      return uButton;
    }).forEach(w => this.root.layout?.addWidget(w));
  }
}