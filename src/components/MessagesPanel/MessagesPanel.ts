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
import { Client, DMChannel, GuildChannel, Message, NewsChannel, TextChannel } from 'discord.js';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../utilities/Events';
import { createLogger } from '../../utilities/Console';
import { MessageItem } from './MessageItem';

const { error, debug } = createLogger('MessagesPanel');

export class MessagesPanel extends QScrollArea {
  private channel?: DMChannel | TextChannel | NewsChannel;

  private rootControls = new QBoxLayout(Direction.BottomToTop);

  private root = new QWidget();

  private lowestWidget?: MessageItem;

  private highestWidget?: MessageItem;

  private items: MessageItem[] = [];

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
      if (!['dm', 'guild'].includes(view)) {
        return;
      }
      const channel = options ? options.dm || options.channel : undefined;
      if (!options || !channel) {
        return;
      }
      await this.handleChannelOpen(channel);
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('message', async (message: Message) => {
        if (message.channel.id === this.channel?.id) {
          const lowest = this.lowestWidget;
          const widget = new MessageItem(this.root);
          (this.root.layout as QBoxLayout).insertWidget(0, widget);
          await widget.loadMessage(message);
          this.items.push(widget);
          this.lowestWidget = widget;
          setTimeout(() => this.isBottom(lowest) && this.ensureVisible(0, MAX_QSIZE), 100);
          this.initAckTimer();
        }
      });
    });
  }

  private initRoot() {
    this.root = new QWidget(this);
    this.root.setObjectName('MessagesContainer');
    this.root.addEventListener(WidgetEventTypes.Move, this.handleWheel.bind(this, false));
    this.rootControls = new QBoxLayout(Direction.BottomToTop);
    this.rootControls.setContentsMargins(0, 25, 0, 25);
    this.rootControls.setSpacing(10);
    this.rootControls.addStretch(1);
    this.root.setLayout(this.rootControls);
    this.setWidget(this.root);
  }

  private p0 = new QPoint(0, 0);

  private isLoading = false;

  private lastLoad: number = 0;

  private async handleWheel(onlyLoadImages = false) {
    if (this.isLoading) {
      return;
    }
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
      if (iy >= y - 400 && iy <= y + height + 100) {
        void item.renderImages();
      }
    }
    try {
      if (!onlyLoadImages && y <= 50 && new Date().getTime() - this.lastLoad >= 1000) {
        this.lastLoad = new Date().getTime();
        if (this.highestWidget?.message?.id) {
          await this.loadMessages(this.highestWidget);
        }
      }
      this.initAckTimer();
    } catch (e) {
      error("Couldn't load a page of messages.", e);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadMessages(before: MessageItem) {
    const { channel } = this;
    const height = this.size().height();
    if (!channel) {
      return;
    }
    const messages = (await channel.messages.fetch({ before: before.message?.id }))
      .array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .reverse();
    if (!messages.length) {
      return;
    }
    const scrollTo = () => {
      this.ensureVisible(0, before.mapToParent(this.p0).y() + height - before.size().height());
    };
    const scrollTimer = setInterval(scrollTo, 1);
    setTimeout(() => clearInterval(scrollTimer), 200);
    if (channel?.type !== 'dm') {
      channel.guild.members
        .fetch({
          user: messages.map((m) => m.author.id),
          withPresences: true,
        })
        .catch((e) => error("Couldn't prefetch members list.", e));
    }
    const promises = messages.map((message, i) => {
      const widget = new MessageItem(this.root);
      if (i === messages.length - 1) {
        this.highestWidget = widget;
      }
      (this.root.layout as QBoxLayout).addWidget(widget);
      return widget.loadMessage(message);
    });
    this.items = [...this.items, ...(await Promise.all(promises))];
  }

  private ratelimit = false;

  private rateTimer?: any;

  private ackTimer?: any;

  private lastRead?: MessageItem;

  private isBottom(widget = this.lowestWidget) {
    if (!widget) {
      return false;
    }
    const rootY = this.root.mapFromParent(this.p0).y();
    const rootHeight = this.size().height();
    const y = widget.mapToParent(this.p0).y();
    const height = widget.size().height();
    return y + height - rootY - rootHeight < 100;
  }

  private initAckTimer() {
    if (this.ackTimer) {
      clearTimeout(this.ackTimer);
    }
    this.ackTimer = setTimeout(async () => {
      if (this.channel && !this.channel.acknowledged) {
        if (this.isBottom()) {
          this.channel.acknowledge().catch((e) => error("Couldn't mark the channel as read.", e));
          this.lastRead?.setInlineStyle('');
        } else {
          for (const widget of (<Set<MessageItem>>this.rootControls.nodeChildren).values()) {
            if (widget.message?.id === this.channel.lastReadMessageID) {
              widget.setInlineStyle('border-bottom: 1px solid red');
              this.lastRead = widget;
            }
          }
        }
      }
      this.ackTimer = undefined;
    }, 500);
  }

  private async handleChannelOpen(channel: DMChannel | GuildChannel) {
    this.channel = channel as TextChannel | NewsChannel | DMChannel;
    if (this.ratelimit || this.isLoading || !['news', 'text', 'dm'].includes(channel.type)) {
      return;
    }
    this.lastLoad = new Date().getTime();

    this.isLoading = true;
    if (this.rateTimer) {
      clearTimeout(this.rateTimer);
    }
    if (this.ackTimer) {
      clearTimeout(this.ackTimer);
    }
    debug(`Opening channel ${channel.id}...`);
    for (const item of this.items) {
      item.destroy();
    }
    this.items = [];
    this.initRoot();
    try {
      if (this.channel.messages.cache.size < 30) {
        await this.channel.messages.fetch({ limit: 30 });
      }
    } catch (e) {
      error(`Couldn't load messages for channel ${channel.id}`, e);
      this.isLoading = false;
    }
    debug(`Total of ${this.channel.messages.cache.size} messages are available.`);
    const messages = this.channel.messages.cache
      .array()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .reverse();
    messages.length = Math.min(messages.length, 30);
    const scrollTimer = setInterval(() => this.ensureVisible(0, MAX_QSIZE), 10);
    const promises = messages.map((message, i) => {
      const widget = new MessageItem(this.root);
      if (i === messages.length - 1) {
        this.highestWidget = widget;
      }
      if (i === 0) {
        this.lowestWidget = widget;
      }
      (this.root.layout as QBoxLayout).addWidget(widget);
      return widget.loadMessage(message);
    });
    debug(`Waiting for ${promises.length} widgets to be loaded...`);
    this.items = await Promise.all(promises);
    debug('Widgets finished loading.');
    setTimeout(() => {
      this.isLoading = false;
      void this.handleWheel(true);
      clearInterval(scrollTimer);
    }, 200);
    this.initAckTimer();
  }
}
