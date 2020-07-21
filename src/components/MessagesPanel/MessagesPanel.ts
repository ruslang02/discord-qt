import { QScrollArea, QWidget, QBoxLayout, Direction, QLabel, ScrollBarPolicy, AlignmentFlag, Shape } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Message, Channel, Client, Snowflake, TextChannel } from "discord.js";
import { MessageItem } from "./MessageItem";
import './MessagesPanel.scss';

class CancelToken {
  cancelled = false;
  cancel() { this.cancelled = true; }
}

export class MessagesPanel extends QScrollArea {
  channel?: Channel;
  rootControls = new QBoxLayout(Direction.BottomToTop);
  root = new QWidget();
  cache = new Map<Channel, Message[]>();
  cancelToken?: CancelToken;

  constructor() {
    super();
    this.setObjectName('MessagesPanel');
    this.setAlignment(AlignmentFlag.AlignBottom + AlignmentFlag.AlignHCenter);
    this.setFrameShape(Shape.NoFrame);
    this.initRoot();
    this.initEvents();
  }

  private initEvents() {
    app.on('dmOpen', (dm: DMChannel) => {
      if(this.cancelToken) this.cancelToken.cancel();
      const token = new CancelToken();
      this.handleChannelOpen(dm, token);
      this.cancelToken = token;
    });

    app.on('client', (client: Client) => {
      client.on('message', async (message: Message) => {
        const cache = this.cache.get(message.channel)
        if(cache !== undefined) {
          cache.shift();
          cache.push(message);
          this.cache.set(message.channel, cache);
        }
        if (message.channel.id === this.channel?.id) {
          const widget = new MessageItem(this.root);
          (this.root.layout as QBoxLayout).insertWidget(0, widget);
          const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
          await widget.loadMessage(message);
          setTimeout(() => clearInterval(scrollTimer), 50);
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

  private scrollDown() {
    this.ensureVisible(0, MAX_QSIZE);
    this.lower();
    this.root.lower();
  }

  private async handleChannelOpen(channel: DMChannel | TextChannel, token: CancelToken) {
    const { cache } = this;
    this.initRoot();
    this.channel = channel;
    if (token.cancelled) return;
    const cached = cache.get(channel);
    let messages: Message[];
    if (cached) messages = cached;
    else {
      const fetched = await channel.fetchMessages({ limit: 50 });
      messages = fetched.array().reverse();
      cache.set(channel, messages);
    }
    const promises: Promise<void>[] = [];
    const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
    messages.forEach(msg => {
      if(token.cancelled) return clearInterval(scrollTimer);
      const widget = new MessageItem(this.root);
      promises.push(widget.loadMessage(msg));
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
    });

    if(token.cancelled) return clearInterval(scrollTimer);
    await Promise.all(promises);
    setTimeout(() => clearInterval(scrollTimer), 100);
  }
}