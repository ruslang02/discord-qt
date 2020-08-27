import { QWidget, QScrollArea, QLabel, QBoxLayout, Direction, Shape, QListWidget, QListWidgetItem, ItemFlag, QVariant, QSize, CursorShape, MatchFlag, WidgetEventTypes } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { Guild, TextChannel, CategoryChannel, Channel, Permissions, User, Collection, GuildChannel } from "discord.js";
import { UserButton } from "../UserButton/UserButton";
import { ChannelButton } from './ChannelButton';
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { ScrollMode } from '@nodegui/nodegui/dist/lib/QtWidgets/QAbstractItemView';
import { GuildsList } from '../GuildsList/GuildsList';

export class ChannelsList extends QListWidget {
  private guild?: Guild;
  private active?: ChannelButton;

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('ChannelsList');
    this.setVerticalScrollMode(ScrollMode.ScrollPerPixel);
    this.setSpacing(2);
    app.on(Events.SWITCH_VIEW, this.handleSwitchView.bind(this));
  }

  async handleSwitchView(view: string, options?: ViewOptions) {
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
      const chan = (([...this.nodeChildren.values()] as ChannelButton[]).find(a => a.channel === options.channel) as ChannelButton);
      this.active?.setActivated(false);
      chan.setActivated(true);
      this.active = chan;
    }
  }

  async loadChannels() {
    const { guild } = this;
    const { client } = app;
    if (!guild) return;

    this.clear();
    const [categories, channels] = guild.channels.cache
      .filter(c => (c.permissionsFor(client.user as User) as Permissions).has('VIEW_CHANNEL'))
      .partition(a => a.type === 'category') as [
      Collection<string, CategoryChannel>,
      Collection<string, GuildChannel>
    ];

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

    for (const channel of channels.sort((a, b) => b.rawPosition - a.rawPosition).values()) {
      const btn = new ChannelButton(this);
      const item = new QListWidgetItem();
      const parent = channel.parentID ? (this.findItems(channel.parentID, MatchFlag.MatchExactly) || [null])[0] : null;
      item.setFlags(~ItemFlag.ItemIsEnabled);
      btn.loadChannel(channel);
      btn.setMinimumSize(0, 32);
      btn.setMaximumSize(MAX_QSIZE, 32);
      item.setSizeHint(btn.size());
      item.setText(channel.id);
      this.insertItem(parent ? this.row(parent) + 1 : 0, item);
      this.setItemWidget(item, btn);
    }
  }
}