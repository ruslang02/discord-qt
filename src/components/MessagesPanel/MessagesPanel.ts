import { QScrollArea, QWidget, QBoxLayout, Direction, QLabel, ScrollBarPolicy, AlignmentFlag } from "@nodegui/nodegui";
import { app } from "../..";
import { DMChannel, Message, Channel, Client } from "discord.js";
import { MessageItem } from "./MessageItem";
import './MessagesPanel.scss';

export class MessagesPanel extends QScrollArea {
  channel?: Channel;
  rootControls = new QBoxLayout(Direction.BottomToTop);
  root = new QWidget();
  messages = new Map<Message, QWidget>();
  avatarCache = new Map<string, Buffer>();

  constructor() {
    super();
    this.setObjectName('MessagesPanel');
    this.setAlignment(AlignmentFlag.AlignBottom + AlignmentFlag.AlignHCenter);
    this.initRoot();
    this.initEvents();
  }

  private initEvents() {
    const { channel, messages, rootControls } = this;
    app.on('dmOpen', this.handleDMOpen.bind(this));

    app.on('client', (client: Client) => {
      client.on('message', (message: Message) => {
        if (message.channel.id === this.channel?.id) {
          const widget = new MessageItem(this.root);
          widget.loadMessage(message);
          messages.set(message, widget);
          console.log(message.content);
          (this.root.layout as QBoxLayout).insertWidget(0, widget);
          setTimeout(() => this.ensureVisible(0, 100000), 100);
        }
      })
    })
  }

  private initRoot() {
    this.takeWidget();
    this.root = new QWidget();
    this.root.setObjectName('MessagesContainer');
    this.rootControls = new QBoxLayout(Direction.BottomToTop);
    this.rootControls.setContentsMargins(0, 0, 0, 25);
    this.rootControls.setSpacing(17);
    this.rootControls.addStretch(1);
    this.root.setLayout(this.rootControls);
    this.setWidget(this.root);
  }

  private async handleDMOpen(dm: DMChannel) {
    this.messages.clear();
    this.initRoot();
    this.channel = dm;

    const { messages, rootControls } = this;
    const fetched = await dm.fetchMessages({ limit: 20 });
    for (const message of fetched.array().reverse()) {
      const widget = new MessageItem(this.root);
      widget.loadMessage(message);
      messages.set(message, widget);
      rootControls.insertWidget(0, widget);
    }
    this.root.lower();
    setTimeout(() => {
      this.ensureVisible(0, 100000);
      this.lower();
      this.root.lower();
    });
  }
}