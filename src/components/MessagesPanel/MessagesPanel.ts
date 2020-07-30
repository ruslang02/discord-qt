import { QScrollArea, QWidget, QBoxLayout, Direction, QLabel, ScrollBarPolicy, AlignmentFlag, Shape, WidgetEventTypes, QPoint } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Message, Channel, Client, Snowflake, TextChannel, Guild } from "discord.js";
import { MessageItem } from "./MessageItem";
import './MessagesPanel.scss';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';
import { Events } from "../../structures/Events";


export class MessagesPanel extends QScrollArea {
  private channel?: DMChannel | TextChannel;
  private rootControls = new QBoxLayout(Direction.BottomToTop);
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
      this.handleWheel(true);
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
    this.root.addEventListener(WidgetEventTypes.Wheel, this.handleWheel.bind(this, false));
    this.setWidget(this.root);
  }

  private scrollDown() {
    this.ensureVisible(0, MAX_QSIZE);
    this.lower();
    this.root.lower();
  }

  private p0 = new QPoint(0, 0);
  private isLoading = false;
  private handleWheel(onlyLoadImages = false) {
    const y = -this.root.mapToParent(this.p0).y() - 20;
    const height = this.size().height();
    const children = [...this.rootControls.nodeChildren.values()] as MessageItem[];
    if (!onlyLoadImages && y <= 50) {
      if (!this.isLoading) {
        this.isLoading = true;
        const oldest = children.pop() as MessageItem;
        if(oldest.message?.id) {
          const scrollTo = () => this.ensureVisible(0, oldest.mapToParent(this.p0).y() + height - oldest.size().height());
          const scrollTimer = setInterval(scrollTo, 1);
          this.loadMessages(oldest.message.id).then(() => {
            this.isLoading = false;
            setTimeout(() => clearInterval(scrollTimer), 200);
          });
        }
      }
    }
    for (const item of children) {
      const iy = item.mapToParent(this.p0).y();
      if (iy >= y - 100 && iy <= y + height + 100) item.renderImages();
    }
  }
  private async loadMessages(before: Snowflake) {
    const { channel } = this;
    if (!channel) return;
    const messages = (await channel.messages.fetch({ before })).array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).reverse();
    for (const message of messages) {
      // console.log(message.content);
      const widget = new MessageItem();
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
      await widget.loadMessage(message);
    }
  }
  private async handleChannelOpen(channel: DMChannel | TextChannel, token: CancelToken) {
    if (this.channel === channel) return;
    this.initRoot();
    this.channel = channel;
    if (token.cancelled) return;
    if (channel.messages.cache.size < 30) await channel.messages.fetch({ limit: 30 });
    if (token.cancelled) return;
    const messages = channel.messages.cache.array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .reverse();
    if (token.cancelled) return;
    messages.length = Math.min(messages.length, 30);
    const scrollTimer = setInterval(this.scrollDown.bind(this), 1);
    const promises = messages.map(message => {
      if (token.cancelled) return clearInterval(scrollTimer);
      const widget = new MessageItem();
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
      return widget.loadMessage(message, token);
    });

    if (token.cancelled) return clearInterval(scrollTimer);
    await Promise.all(promises);
    setTimeout(() => clearInterval(scrollTimer), 300);
  }
}