import { CursorShape, ItemFlag, MatchFlag, QLabel, QListWidget, QListWidgetItem, Shape, WidgetEventTypes } from "@nodegui/nodegui";
import { CategoryChannel, Client, Collection, Guild, GuildChannel, Permissions, User } from "discord.js";
import { app, MAX_QSIZE } from "../..";
import { Events } from "../../structures/Events";
import { createLogger } from '../../utilities/Console';
import { ViewOptions } from '../../views/ViewOptions';
import { ChannelButton } from './ChannelButton';
import { Constants } from 'discord.js';
import { DQConstants } from '../../patches/Constants';
import { Message } from 'discord.js';

const { debug } = createLogger('[ChannelsList]');
export class ChannelsList extends QListWidget {
  private guild?: Guild;
  private active?: ChannelButton;
  private buttons: Set<ChannelButton> = new Set();

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('ChannelsList');
    this.setVerticalScrollMode(1);
    this.setSpacing(2);
    app.on(Events.SWITCH_VIEW, this.handleSwitchView.bind(this));
    app.on(Events.NEW_CLIENT, this.handleEvents.bind(this));
  }

  private handleEvents(client: Client) {
    const { Events: DEvents } = Constants as DQConstants;
    client.on(DEvents.MESSAGE_ACK, (data: any) => {
      [...this.buttons.values()].find(btn => btn.channel?.id === data.channel_id)?.setUnread(false);
    });
    client.on('message', (message: Message) => {
      [...this.buttons.values()].find(btn => btn.channel?.id === message.channel.id)?.setUnread(true);
    })
  }

  private async handleSwitchView(view: string, options?: ViewOptions) {
    if (view !== 'guild' || !options) return;
    let newGuild;
    if (options.guild) newGuild = options.guild;
    else if (options.channel) newGuild = options.channel.guild;
    else return;
    if (newGuild.id !== this.guild?.id) {
      this.guild = newGuild;
      await this.loadChannels();
    }
    if (options.channel) {
      const chan = ([...this.nodeChildren.values()] as ChannelButton[]).find(a => a.channel === options.channel);
      this.active?.setActivated(false);
      chan?.setActivated(true);
      this.active = chan;
    } else this.active = undefined;
  }

  async loadChannels() {
    const { guild, buttons } = this;
    const { client } = app;
    if (!guild) return;

    debug(`Loading channels of guild ${guild.name} (${guild.id})...`);
    this.clear();
    const [categories, channels] = guild.channels.cache
      .filter(c => (c.permissionsFor(client.user as User) as Permissions).has('VIEW_CHANNEL'))
      .partition(a => a.type === 'category') as [
      Collection<string, CategoryChannel>,
      Collection<string, GuildChannel>
    ];
    debug(`Loading ${categories.size} categories...`);
    for (const category of categories.sort((a, b) => a.rawPosition - b.rawPosition).values()) {
      const item = new QListWidgetItem();
      const label = new QLabel(this);
      let isOpened = true;
      label.setObjectName('CategoryHeader')
      label.setText(`<html>▼&nbsp;&nbsp;${category.name}</html>`);
      label.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
        isOpened = !isOpened;
        label.setText(`<html>${isOpened ? '▼' : '►'}&nbsp;&nbsp;${category.name}</html>`);
        const channelIds = guild.channels.cache.filter(a => a.parentID === category.id).map(a => a.id);
        for (const id of channelIds) {
          const chItem = this.findItems(id, MatchFlag.MatchExactly)[0];
          this.setRowHidden(this.row(chItem), !isOpened);
        }
      })
      label.setMinimumSize(0, 30);
      label.setCursor(CursorShape.PointingHandCursor);
      item.setText(category.id);
      item.setFlags(~ItemFlag.ItemIsEnabled);
      this.addItem(item);
      item.setSizeHint(label.size());
      this.setItemWidget(item, label);
      label.adjustSize();
    }

    debug(`Loading ${channels.size} channels...`);
    for (const channel of channels.sort((a, b) => b.rawPosition - a.rawPosition).values()) {
      const btn = new ChannelButton(this);
      const item = new QListWidgetItem();
      const parentItems = channel.parentID ? this.findItems(channel.parentID, MatchFlag.MatchExactly) : [];
      item.setFlags(~ItemFlag.ItemIsEnabled);
      btn.loadChannel(channel);
      btn.setMinimumSize(0, 32);
      btn.setMaximumSize(MAX_QSIZE, 32);
      item.setSizeHint(btn.size());
      item.setText(channel.id);
      this.insertItem(parentItems && parentItems.length ? this.row(parentItems[0]) + 1 : 0, item);
      this.setItemWidget(item, btn);
      buttons.add(btn);
      btn.addEventListener(WidgetEventTypes.DeferredDelete, () => buttons.delete(btn));
    }
  }
}