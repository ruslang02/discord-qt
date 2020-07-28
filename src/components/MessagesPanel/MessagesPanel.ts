import { QScrollArea, QWidget, QBoxLayout, Direction, QLabel, ScrollBarPolicy, AlignmentFlag, Shape, WidgetEventTypes, QPoint } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Message, Channel, Client, Snowflake, TextChannel, Guild } from "discord.js";
import { MessageItem } from "./MessageItem";
import './MessagesPanel.scss';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';
import { Events } from "../../structures/Events";


export class MessagesPanel extends QScrollArea {
  private channel?: Channel;
  private rootControls = new QBoxLayout(Direction.BottomToTop);
  private root = new QWidget();
  private cache = new WeakMap<Channel, Message[]>();
  private cancelToken?: CancelToken;

  constructor() {
    super();
    this.setObjectName('MessagesPanel');
    this.setAlignment(AlignmentFlag.AlignBottom + AlignmentFlag.AlignHCenter);
    this.setFrameShape(Shape.NoFrame);
    this.initRoot();
    this.initEvents();
  }

  private initEvents() {
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view) || !options) return;
      const channel = options.dm || options.channel || null;
      if (!channel) return;
      if (this.cancelToken) this.cancelToken.cancel();
      const token = new CancelToken();
      this.handleChannelOpen(channel, token);
      this.cancelToken = token;
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('message', async (message: Message) => {
        const cache = this.cache.get(message.channel)
        if (cache !== undefined) {
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
    this.rootControls.setContentsMargins(0, 25, 0, 25);
    this.rootControls.addStretch(1);
    this.root.setLayout(this.rootControls);
    this.root.addEventListener(WidgetEventTypes.Wheel, this.handleWheel.bind(this))
    this.setWidget(this.root);
  }

  private scrollDown() {
    this.ensureVisible(0, MAX_QSIZE);
    this.lower();
    this.root.lower();
  }

  private p0 = new QPoint(0, 0);
  private handleWheel() {
    const y = -this.root.mapToParent(this.p0).y();
    const height = this.size().height();
    let i = 0;
    for (const item of (this.rootControls.nodeChildren as Set<MessageItem>)) {
      if (i > y && i < y + height) item.renderAttachments();
      i += item.size().height();
      if (i > y + height) return;
    }
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
      const fetched = await channel.messages.fetch({ limit: 50 });
      messages = fetched.array().reverse();
      cache.set(channel, messages);
    }
    const promises: Promise<void>[] = [];
    const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
    for (const message of messages) {
      if (token.cancelled) return clearInterval(scrollTimer);
      const widget = new MessageItem(this.root);
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
      promises.push(widget.loadMessage(message, token));
    }

    if (token.cancelled) return clearInterval(scrollTimer);
    await Promise.all(promises);
    setTimeout(() => clearInterval(scrollTimer), 100);
  }
}