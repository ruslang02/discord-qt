import {
  CursorShape,
  ItemFlag,
  QLabel,
  QListWidget,
  QListWidgetItem,
  QPoint,
  QSize,
  ScrollBarPolicy,
  Shape,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  CategoryChannel,
  Client,
  Collection,
  Constants,
  DQConstants,
  Guild,
  GuildChannel,
  Permissions,
  Snowflake,
  //  VoiceChannel,
  VoiceState,
} from 'discord.js';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { ChannelButton } from './ChannelButton';
import { ChannelMembers } from './ChannelMembers';
import { ChannelsListMenu } from './ChannelsListMenu';

const { debug } = createLogger('ChannelsList');

export class ChannelsList extends QListWidget {
  private guild?: Guild;

  private active?: ChannelButton;

  private buttons = new Map<string, ChannelButton>();

  private vcMembers = new Map<string, ChannelMembers>();

  private categories = new Map<string, QLabel>();

  private menu = new ChannelsListMenu(this);

  private ratelimit = false;

  private rateTimer?: any;

  private minSize = new QSize(150, 36);

  constructor() {
    super();

    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('ChannelsList');
    this.setVerticalScrollMode(1);
    this.setSpacing(0);
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);

    app.on(AppEvents.SWITCH_VIEW, this.handleSwitchView.bind(this));
    app.on(AppEvents.NEW_CLIENT, this.handleEvents.bind(this));
    app.on(AppEvents.CONFIG_UPDATE, () => this.updateState());
  }

  private handleEvents(client: Client) {
    const { Events } = (Constants as unknown) as DQConstants;

    client.on(Events.MESSAGE_ACK, (channel) => {
      const button = this.buttons.get(channel.id);

      if (button) {
        button.setUnread(false);
      }
    });

    client.on(Events.MESSAGE_CREATE, (message) => {
      const button = this.buttons.get(message.channel.id);

      if (button) {
        button.setUnread(true);
      }
    });

    client.on(Events.VOICE_STATE_UPDATE, this.handleVoiceStateUpdate.bind(this));
  }

  private handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    for (const state of [oldState, newState]) {
      const component = this.vcMembers.get(state.channelID || '');

      if (component && !component.native.destroyed) {
        component.handleVoiceStateUpdate(oldState, newState);
      }
    }
  }

  private async handleSwitchView(view: string, options?: ViewOptions) {
    if (view !== 'guild' || !options) {
      return;
    }

    let newGuild;

    if (options.guild) {
      newGuild = options.guild;
    } else if (options.channel) {
      newGuild = options.channel.guild;
    } else {
      return;
    }

    if (newGuild.id !== this.guild?.id) {
      this.loadChannels(newGuild);
    }

    if (options.channel) {
      const chan = this.buttons.get(options.channel.id);

      chan?.setActivated(true);

      this.active?.setActivated(false);
      this.active = chan;
    } else {
      delete this.active;
    }
  }

  private updateState() {
    if (!this.guild) {
      return;
    }

    const settings = app.config.get('userLocalGuildSettings')[this.guild.id];

    for (const item of <IterableIterator<QListWidgetItem>>this.items.values()) {
      const channel = app.client.channels.resolve(item.text());

      if (channel instanceof GuildChannel) {
        if (!channel || item.native.destroyed) {
          return;
        }

        const isCollapsed = settings?.collapsedCategories?.includes(channel.parentID || '');
        const isMuteAndHidden = !!channel.muted && !!settings?.hideMutedChannels;

        this.setRowHidden(this.row(item), isCollapsed || isMuteAndHidden);
      }

      if (channel instanceof CategoryChannel) {
        const arrow = settings?.collapsedCategories?.includes(channel.id) ? '►' : '▼';

        this.categories
          .get(channel.id)
          ?.setText(`<html>${arrow}&nbsp;&nbsp;${channel.name}</html>`);
      }
    }
  }

  private toggleCategory(guildId: Snowflake, categoryId: Snowflake) {
    const userLocalGuildSettings = app.config.get('userLocalGuildSettings');
    const settings = userLocalGuildSettings[guildId] || {};

    settings.collapsedCategories = settings.collapsedCategories || [];

    if (settings.collapsedCategories.includes(categoryId)) {
      settings.collapsedCategories = settings.collapsedCategories.filter((id) => id !== categoryId);
    } else {
      settings.collapsedCategories.push(categoryId);
    }

    userLocalGuildSettings[guildId] = settings;
    void app.config.save();

    this.updateState();
  }

  private loadChannels(guild: Guild) {
    this.guild = guild;

    if (this.ratelimit) {
      return;
    }

    this.ratelimit = true;

    if (this.rateTimer) {
      clearTimeout(this.rateTimer);
    }

    debug(`Loading channels of guild ${guild.name} (${guild.id})...`);

    this.clear();
    this.nodeChildren.clear();
    this.buttons.clear();
    this.items.clear();
    this.vcMembers.forEach((w) => {
      const o = w;

      o.native.destroyed = true;
    });

    this.vcMembers.clear();

    const [categories, channels] = guild.channels.cache
      .filter((c) => c.can(Permissions.FLAGS.VIEW_CHANNEL))
      .partition((a) => a.type === 'category') as [
      Collection<string, CategoryChannel>,
      Collection<string, GuildChannel>
    ];

    debug(`Loading ${categories.size} categories...`);

    const sortedCategories = categories.sort((a, b) => a.rawPosition - b.rawPosition).values();

    for (const category of sortedCategories) {
      const label = new QLabel(this);

      label.setObjectName('CategoryHeader');
      label.setMinimumSize(0, 30);
      label.setCursor(CursorShape.PointingHandCursor);
      label.adjustSize();
      label.addEventListener(
        WidgetEventTypes.MouseButtonPress,
        this.toggleCategory.bind(this, guild.id, category.id)
      );

      const item = new QListWidgetItem();

      item.setText(category.id);
      item.setFlags(~ItemFlag.ItemIsEnabled);
      item.setSizeHint(label.size());

      this.addItem(item);
      this.setItemWidget(item, label);

      this.categories.set(category.id, label);
    }

    debug(`Loading ${channels.size} channels...`);

    const sortedChannels = channels.sort((a, b) => b.rawPosition - a.rawPosition).values();

    for (const channel of sortedChannels) {
      // Get row number to insert the channel
      const parentItems = channel.parentID ? this.findItems(channel.parentID, 0) : [];
      const row = parentItems && parentItems.length ? this.row(parentItems[0]) + 1 : 0;

      const item = new QListWidgetItem();

      item.setFlags(~ItemFlag.ItemIsEnabled);
      item.setSizeHint(this.minSize);
      item.setText(channel.id);
      this.insertItem(row, item);

      const btn = new ChannelButton(this);

      btn.loadChannel(channel);
      btn.setFixedSize(232, 32);

      if (channel.muted) {
        btn.setMuted(true);
      }

      this.setItemWidget(item, btn);

      btn.addEventListener('customContextMenuRequested', (pos) => {
        this.menu.setChannel(channel);
        this.menu.popup(btn.mapToGlobal(new QPoint(pos.x, pos.y)));
      });

      this.buttons.set(channel.id, btn);
      btn.addEventListener(WidgetEventTypes.DeferredDelete, () => this.buttons.delete(channel.id));
      /* Causes crashes due to GC
      if (channel.type === 'voice') {
        const members = new ChannelMembers(channel as VoiceChannel);

        this.vcMembers.set(channel.id, members);

        const memitem = new QListWidgetItem();

        memitem.setText(channel.id);
        this.insertItem(row + 1, memitem);
        this.setItemWidget(memitem, members);
        members.setItem(memitem);
      }
      */
    }

    this.updateState();

    this.rateTimer = setTimeout(() => {
      this.ratelimit = false;

      if (guild !== this.guild && this.guild) {
        this.loadChannels(this.guild);
      }
    }, 500);
  }
}
