import { QWidget, QScrollArea, QLabel, QBoxLayout, Direction, Shape } from "@nodegui/nodegui";
import { app, MAX_QSIZE } from "../..";
import { Guild, TextChannel, CategoryChannel, Channel, Permissions, User } from "discord.js";
import { UserButton } from "../UserButton/UserButton";
import { ChannelButton } from './ChannelButton';
import { ViewOptions } from '../../views/ViewOptions';

export class ChannelsList extends QScrollArea {
  guild?: Guild;
  root = new QWidget();
  widgets = new QBoxLayout(Direction.TopToBottom);
  channels = new WeakMap<Channel, ChannelButton/* | QLabel*/>();
  active?: ChannelButton;

  constructor() {
    super();
    this.setFrameShape(Shape.NoFrame);
    this.setObjectName('ChannelsContainer');
    /*
    app.on('client', (client: Client) => {
      client.on('ready', this.loadDMs.bind(this))
    });
    */
    app.on('switchView', async (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      let newGuild;
      if (options.guild) newGuild = options.guild;
      else if (options.channel) newGuild = options.channel.guild;
      else return;
      if(newGuild.id !== this.guild?.id) {
        this.guild = newGuild;
        await this.loadChannels();
      }
      if (options.channel) {
        const chan = (this.channels.get(options.channel) as ChannelButton);
        this.active?.setActivated(false);
        chan.setActivated(true);
        this.active = chan;
      }
    })
    this.initRoot();
  }

  private initRoot() {
    this.takeWidget();
    this.root = new QWidget();
    this.widgets = new QBoxLayout(Direction.TopToBottom);
    this.root.setLayout(this.widgets);
    this.root.setObjectName('ChannelsList');
    this.widgets.addStretch(1);
    this.widgets.setSpacing(2);
    this.widgets.setContentsMargins(8, 8, 8, 8);
    this.setWidget(this.root);
  }

  async loadChannels() {
    const { guild } = this;
    const { client } = app;
    if (!guild) return;
    this.initRoot();

    const channels = (guild.channels.cache
      .filter(c => ['text'/*, 'category'*/].includes(c.type))
      .filter(c => (c.permissionsFor(client.user as User) as Permissions).has('VIEW_CHANNEL'))
      .sort((a, b) => a.position - b.position)
      .array() as (TextChannel/* | CategoryChannel*/)[])
    /* if(channels.every(c => this.channels.has(c))) {
      channels.forEach((channel, i) => {
        const widget = this.channels.get(channel) as QWidget;
        console.log('cache', channel, widget)
        this.widgets.insertWidget(i, widget)
      });
      return;
    } */
    channels.forEach((channel, i) => {
      // if(channel.type === 'text') {
        const btn = new ChannelButton();
        btn.loadChannel(channel as TextChannel);
        btn.setMinimumSize(0, 32);
        btn.setMaximumSize(MAX_QSIZE, 32);
        btn.addEventListener('clicked', () => {
          app.emit('switchView', 'guild', { channel })
        });
        this.channels.set(channel, btn);
        this.widgets.insertWidget(i, btn);
        return btn;
      /* } else {
        const label = new QLabel(this);
        label.setText(channel.name);
        label.setObjectName('CategoryHeader');
        this.channels.set(channel, label);
        this.widgets.insertWidget(i, label);
        return label;
      }*/
    });
  }
}