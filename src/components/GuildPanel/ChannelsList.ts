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
  Permissions, Snowflake, VoiceChannel, VoiceState,
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

  // private listItems = new Set<QListWidgetItem>();

  private vcMembers = new Map<string, ChannelMembers>();

  private categories = new Map<string, QLabel>();

  private menu = new ChannelsListMenu(this);

  private ratelimit = false;

  private rateTimer?: any;

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
    const { Events } = Constants as unknown as DQConstants;
    client.on(Events.MESSAGE_ACK, (channel) => {
      const button = this.buttons.get(channel.id);
      if (button) button.setUnread(false);
    });
    client.on(Events.MESSAGE_CREATE, (message) => {
      const button = this.buttons.get(message.channel.id);
      if (button) button.setUnread(true);
    });
    client.on(Events.VOICE_STATE_UPDATE, this.handleVoiceStateUpdate.bind(this));
  }

  private handleVoiceStateUpdate(o: VoiceState, n: VoiceState) {
    for (const state of [o, n]) {
      const component = this.vcMembers.get(state.channelID || '');
      if (component) component.handleVoiceStateUpdate(o, n);
    }
  }

  private async handleSwitchView(view: string, options?: ViewOptions) {
    if (view !== 'guild' || !options) return;
    let newGuild;
    if (options.guild) newGuild = options.guild;
    else if (options.channel) newGuild = options.channel.guild;
    else return;
    if (newGuild.id !== this.guild?.id) {
      this.loadChannels(newGuild);
    }
    if (options.channel) {
      const chan = this.buttons.get(options.channel.id);
      this.active?.setActivated(false);
      chan?.setActivated(true);
      this.active = chan;
    } else this.active = undefined;
  }

  private minSize = new QSize(150, 36);

  private updateState() {
    if (!this.guild) return;
    const settings = app.config.userLocalGuildSettings[this.guild.id];
    for (const item of (<IterableIterator<QListWidgetItem>> this.items.values())) {
      const channel = app.client.channels.resolve(item.text());
      if (channel instanceof GuildChannel) {
        const isOpen = !settings?.collapsedCategories?.includes(channel.parentID || '');
        if (!channel || item.native.destroyed) return;
        this.setRowHidden(this.row(item), !isOpen
          || (!!channel.muted && (settings?.hideMutedChannels ?? false)));
      }
      if (channel instanceof CategoryChannel) {
        const arrow = settings?.collapsedCategories?.includes(channel.id) ? '►' : '▼';
        this.categories.get(channel.id)?.setText(`<html>${arrow}&nbsp;&nbsp;${channel.name}</html>`);
      }
    }
  }

  private toggleCategory(guildId: Snowflake, categoryId: Snowflake) {
    const s = { ...app.config.userLocalGuildSettings[guildId] };
    s.collapsedCategories = [...(s.collapsedCategories || [])] as string[];
    if (s.collapsedCategories.includes(categoryId)) {
      s.collapsedCategories = s.collapsedCategories.filter((id) => id !== categoryId);
    } else s.collapsedCategories = [...s.collapsedCategories, categoryId];

    app.config.userLocalGuildSettings[guildId] = s;
    void app.configManager.save();

    this.updateState();
  }

  private loadChannels(guild: Guild) {
    this.guild = guild;
    if (this.ratelimit) return;
    this.ratelimit = true;
    if (this.rateTimer) clearTimeout(this.rateTimer);
    if (!guild) return;

    debug(`Loading channels of guild ${guild.name} (${guild.id})...`);

    this.clear();
    this.nodeChildren.clear();
    this.buttons.clear();
    this.items.clear();
    // this.listItems.clear();
    this.vcMembers.clear();

    const [categories, channels] = guild.channels.cache
      .filter((c) => c.can(Permissions.FLAGS.VIEW_CHANNEL))
      .partition((a) => a.type === 'category') as [
        Collection<string, CategoryChannel>,
        Collection<string, GuildChannel>
      ];
    debug(`Loading ${categories.size} categories...`);
    for (const category of categories.sort((a, b) => a.rawPosition - b.rawPosition).values()) {
      const item = new QListWidgetItem();
      const label = new QLabel(this);
      label.setObjectName('CategoryHeader');
      label.addEventListener(WidgetEventTypes.MouseButtonPress,
        this.toggleCategory.bind(this, guild.id, category.id));
      label.setMinimumSize(0, 30);
      label.setCursor(CursorShape.PointingHandCursor);
      item.setText(category.id);
      item.setFlags(~ItemFlag.ItemIsEnabled);
      this.addItem(item);
      item.setSizeHint(label.size());
      this.setItemWidget(item, label);
      this.categories.set(category.id, label);
      label.adjustSize();
    }

    debug(`Loading ${channels.size} channels...`);
    for (const channel of channels.sort((a, b) => b.rawPosition - a.rawPosition).values()) {
      const btn = new ChannelButton(this);
      const item = new QListWidgetItem();
      const parentItems = channel.parentID ? this.findItems(channel.parentID, 0) : [];
      const row = parentItems && parentItems.length ? this.row(parentItems[0]) + 1 : 0;
      item.setFlags(~ItemFlag.ItemIsEnabled);
      btn.loadChannel(channel);
      btn.setFixedSize(232, 32);
      if (channel.muted) btn.setMuted(true);
      item.setSizeHint(this.minSize);
      item.setText(channel.id);
      this.insertItem(row, item);
      this.setItemWidget(item, btn);
      this.buttons.set(channel.id, btn);
      btn.addEventListener(WidgetEventTypes.DeferredDelete, () => this.buttons.delete(channel.id));
      btn.addEventListener('customContextMenuRequested', (pos) => {
        this.menu.setChannel(channel);
        this.menu.popup(btn.mapToGlobal(new QPoint(pos.x, pos.y)));
      });
      if (channel.type === 'voice') {
        const members = new ChannelMembers(this);
        members.loadChannel(channel as VoiceChannel);
        const memitem = new QListWidgetItem();
        memitem.setText(channel.id);
        this.insertItem(row + 1, memitem);
        this.setItemWidget(memitem, members);
        this.vcMembers.set(channel.id, members);
        members.setItem(memitem);
      }
    }

    this.updateState();

    this.rateTimer = setTimeout(() => {
      this.ratelimit = false;
      if (guild !== this.guild && this.guild) this.loadChannels(this.guild);
    }, 500);
  }
}
