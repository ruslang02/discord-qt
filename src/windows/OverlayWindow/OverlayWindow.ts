import { Direction, QBoxLayout, QWidget, WidgetAttribute, WindowType } from '@nodegui/nodegui';
import { Client, Constants, GuildMember, Snowflake, VoiceChannel } from 'discord.js';
import { existsSync, promises } from 'fs';
import { join } from 'path';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { OverlayMember } from './OverlayMember';

const { readFile } = promises;
const { error } = createLogger('OverlayWindow');
const stylePath = join(__dirname, 'themes', 'dark.theme.css');

export class OverlayWindow extends QWidget {
  private channel?: VoiceChannel;

  private members = new Map<Snowflake, OverlayMember>();

  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();

    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.setAttribute(WidgetAttribute.WA_TransparentForMouseEvents, true);
    this.setWindowFlag(
      WindowType.X11BypassWindowManagerHint |
        WindowType.FramelessWindowHint |
        WindowType.WindowStaysOnTopHint |
        WindowType.WindowTransparentForInput |
        WindowType.WindowDoesNotAcceptFocus |
        WindowType.NoDropShadowWindowHint |
        WindowType.WindowSystemMenuHint |
        WindowType.WindowMinimizeButtonHint,
      true
    );

    this.initWindow();

    app.on(AppEvents.NEW_CLIENT, this.bindEvents.bind(this));
  }

  private bindEvents(client: Client) {
    const { Events } = Constants;
    const { hide, show, initChannel, addMember, removeMember } = this;

    client.on(Events.VOICE_STATE_UPDATE, (o, n) => {
      if (n.member?.user === app.client.user) {
        if (!n.channel) {
          this.channel = undefined;
          hide.call(this);

          return;
        }

        if (this.channel !== n.channel) {
          this.channel = n.channel;
          initChannel();
          show.call(this);
        }
      }

      if (!this.channel || !n.member) {
        return;
      }

      if (o.channel === this.channel && n.channel !== this.channel) {
        addMember(n.member);
      }

      if (o.channel !== this.channel && n.channel === this.channel) {
        removeMember(n.member);
      }
    });
  }

  private initWindow = () => {
    const { layout } = this;

    this.setLayout(layout);

    if (!existsSync(stylePath)) {
      error("Overlay couldn't find the theme.");

      return;
    }

    readFile(stylePath, 'utf8')
      .then((css) => this.setStyleSheet(css))
      .catch(error);
  };

  private addMember = (member: GuildMember) => {
    const { layout } = this;
    const widget = new OverlayMember(member);

    layout.insertWidget(0, widget, 0);

    return widget;
  };

  private removeMember = (member: GuildMember) => {
    const { layout, members } = this;

    const widget = members.get(member.id);

    if (widget) {
      widget.close();
      layout.removeWidget(widget);
    }
  };

  private initChannel = () => {
    const { addMember, channel, layout, members } = this;

    if (!channel) {
      return;
    }

    for (const widget of members.values()) {
      widget.close();
      layout.removeWidget(widget);
    }

    this.members = channel.members.mapValues(addMember);
  };
}
