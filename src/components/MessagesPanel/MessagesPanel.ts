import {
  AlignmentFlag,
  Direction,
  QBoxLayout,
  QPoint,
  QScrollArea,
  QWidget,
  ScrollBarPolicy,
  Shape,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  Client, DMChannel, GuildChannel, Message, NewsChannel, TextChannel,
} from 'discord.js';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../structures/Events';
import { createLogger } from '../../utilities/Console';
import { MessageItem } from './MessageItem';

const { debug } = createLogger('MessagesPanel');

export class MessagesPanel extends QScrollArea {
  private channel?: DMChannel | TextChannel | NewsChannel;

  private rootControls = new QBoxLayout(Direction.BottomToTop);

  private root = new QWidget();

  constructor(parent?: any) {
    super(parent);
    this.setObjectName('MessagesPanel');
    this.setAlignment(AlignmentFlag.AlignBottom + AlignmentFlag.AlignHCenter);
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.setFrameShape(Shape.NoFrame);
    this.initRoot();
    this.initEvents();
  }

  private initEvents() {
    app.on(Events.SWITCH_VIEW, async (view, options) => {
      if (!['dm', 'guild'].includes(view)) return;
      const channel = options ? options.dm || options.channel : undefined;
      if (!options || !channel) {
        this.channel = undefined;
        this.initRoot();
        return;
      }
      await this.handleChannelOpen(channel);
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('message', async (message: Message) => {
        if (message.channel.id === this.channel?.id) {
          const widget = new MessageItem(this);
          (this.root.layout as QBoxLayout).addWidget(widget);
          await widget.loadMessage(message);
          setTimeout(() => this.ensureVisible(0, MAX_QSIZE), 100);
          if (this.ackTimer) return;
          this.ackTimer = setTimeout(() => {
            if (this.channel) this.channel.acknowledge();
            this.ackTimer = undefined;
          }, 1000);
        }
      });
    });
  }

  private initRoot() {
    this.root = new QWidget(this);
    this.root.setObjectName('MessagesContainer');
    this.root.addEventListener(WidgetEventTypes.Move, this.handleWheel.bind(this, false));
    this.rootControls = new QBoxLayout(Direction.TopToBottom);
    this.rootControls.setContentsMargins(0, 25, 0, 25);
    this.rootControls.setSpacing(10);
    this.rootControls.addStretch(1);
    this.root.setLayout(this.rootControls);
    this.setWidget(this.root);
  }

  private p0 = new QPoint(0, 0);

  private isLoading = false;

  private async handleWheel(onlyLoadImages = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    const y = -this.root.mapToParent(this.p0).y() - 20;
    const height = this.size().height();
    const children = [...this.rootControls.nodeChildren.values()] as MessageItem[];
    if (children.length === 0) {
      this.isLoading = false;
      return;
    }
    for (const item of children) {
      const iy = item.mapToParent(this.p0).y();
      if (iy >= y - 400 && iy <= y + height + 100) item.renderImages();
    }
    if (!onlyLoadImages && y <= 50) {
      const oldest = children.pop();
      if (oldest?.message?.id) await this.loadMessages(oldest);
    }
    this.isLoading = false;
  }

  private async loadMessages(before: MessageItem) {
    const { channel } = this;
    const height = this.size().height();
    if (!channel) return;
    const messages = (await channel.messages.fetch({ before: before.message?.id })).array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).reverse();
    if (!messages.length) return;
    const scrollTo = () => {
      this.ensureVisible(0, before.mapToParent(this.p0).y() + height - before.size().height());
    };
    const scrollTimer = setInterval(scrollTo, 1);
    setTimeout(() => clearInterval(scrollTimer), 200);
    if (channel?.type !== 'dm') {
      channel.guild.members.fetch({
        user: messages.map((m) => m.author.id),
        withPresences: true,
      });
    }
    for (const message of messages) {
      const widget = new MessageItem();
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
      widget.loadMessage(message);
    }
  }

  private ratelimit = false;

  private rateTimer?: any;

  private ackTimer?: any;

  private async handleChannelOpen(channel: DMChannel | GuildChannel) {
    if (this.ratelimit
      || this.isLoading
      || this.channel === channel
      || !['news', 'text', 'dm'].includes(channel.type)
    ) return;

    this.isLoading = true;
    this.ratelimit = true;
    this.hide();
    if (this.rateTimer) clearTimeout(this.rateTimer);
    if (this.ackTimer) clearTimeout(this.ackTimer);
    this.rateTimer = setTimeout(() => { this.ratelimit = false; }, 1000);
    debug(`Opening channel ${channel.id}...`);
    this.initRoot();

    const textChannel = channel as TextChannel | NewsChannel | DMChannel;
    this.channel = textChannel;

    if (textChannel.messages.cache.size < 30) await textChannel.messages.fetch({ limit: 30 });
    debug(`Total of ${textChannel.messages.cache.size} messages are available.`);
    const messages = textChannel.messages.cache.array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .reverse();
    messages.length = Math.min(messages.length, 30);
    const scrollTimer = setInterval(() => this.ensureVisible(0, MAX_QSIZE), 10);
    const promises = messages.map((message) => {
      const widget = new MessageItem();
      (this.root.layout as QBoxLayout).insertWidget(0, widget);
      return widget.loadMessage(message);
    });
    debug(`Waiting for ${promises.length} widgets to be loaded...`);
    await Promise.all(promises);
    debug('Widgets finished loading.');
    this.show();
    setTimeout(() => {
      this.isLoading = false;
      this.handleWheel(true);
      clearInterval(scrollTimer);
    }, 200);
    this.ackTimer = setTimeout(() => {
      if (this.channel) this.channel.acknowledge();
      this.ackTimer = undefined;
    }, 1000);
  }
}
