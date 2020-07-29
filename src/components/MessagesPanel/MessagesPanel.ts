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
  private rootControls = new QBoxLayout(Direction.TopToBottom);
  private root = new QWidget();
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
    app.on(Events.SWITCH_VIEW, async (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view) || !options) return;
      const channel = options.dm || options.channel || null;
      if (!channel) return;
      if (this.cancelToken) this.cancelToken.cancel();
      this.cancelToken = new CancelToken();
      await this.handleChannelOpen(channel, this.cancelToken);
      this.handleWheel();
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('message', async (message: Message) => {
        if (message.channel.id === this.channel?.id) {
          const widget = new MessageItem(this);
          (this.root.layout as QBoxLayout).addWidget(widget);
          const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
          await widget.loadMessage(message);
          setTimeout(() => clearInterval(scrollTimer), 50);
        }
      })
    })
  }

  private initRoot() {
    //this.takeWidget();
    this.root = new QWidget(this);
    this.root.setObjectName('MessagesContainer');
    this.rootControls = new QBoxLayout(Direction.TopToBottom);
    this.rootControls.setContentsMargins(0, 25, 0, 25);
    this.rootControls.setSpacing(10);
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
    const y = -this.root.mapToParent(this.p0).y() - 20;
    const height = this.size().height();
    for (const item of (this.rootControls.nodeChildren as Set<MessageItem>)) {
      const iy = item.mapToParent(this.p0).y();
      if (iy >= y - 100 && iy <= y + height + 100) item.renderImages();
      if (iy > y + height) return;
    }
  }
  private async handleChannelOpen(channel: DMChannel | TextChannel, token: CancelToken) {
    this.initRoot();
    this.channel = channel;
    if (token.cancelled) return;
    if (channel.messages.cache.size < 50) await channel.messages.fetch({ limit: 50 });
    const messages = channel.messages.cache.array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    messages.length = Math.min(messages.length, 50);
    const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
    const promises = messages.map(message => {
      if (token.cancelled) return clearInterval(scrollTimer);
      const widget = new MessageItem();
      (this.root.layout as QBoxLayout).addWidget(widget);
      return widget.loadMessage(message, token);
    });

    if (token.cancelled) return clearInterval(scrollTimer);
    await Promise.all(promises);
    setTimeout(() => clearInterval(scrollTimer), 300);
  }
}