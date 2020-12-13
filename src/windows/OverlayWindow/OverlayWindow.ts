import { Direction, QBoxLayout, QWidget, WidgetAttribute, WindowType } from '@nodegui/nodegui';
import {
  Client,
  Constants,
  GuildMember,
  Snowflake,
  VoiceChannel,
  VoiceConnection,
  VoiceState,
} from 'discord.js';
import { existsSync, promises } from 'fs';
import { join } from 'path';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { OverlayMember } from './OverlayMember';

const { readFile } = promises;
const { error, log } = createLogger('OverlayWindow');
const stylePath = join(__dirname, 'themes', 'dark.theme.css');

export class OverlayWindow extends QWidget {
  private channel?: VoiceChannel;

  private members = new Map<Snowflake, OverlayMember>();

  private connection?: VoiceConnection;

  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();

    this.setObjectName('OverlayWindow');
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
    const { handleVoiceStateUpdate } = this;

    client.on(Events.VOICE_STATE_UPDATE, handleVoiceStateUpdate.bind(this));
  }

  private handleVoiceStateUpdate(o: VoiceState, n: VoiceState) {
    const { members, hide, show, initChannel, addMember, removeMember } = this;

    log({
      ochannel: o.channel,
      oconn: o.connection,
      om: o.member,
      nchannel: n.channel,
      nconn: n.connection,
      nm: n.member,
    });

    if (n.connection && n.connection !== this.connection) {
      this.connection = n.connection;

      n.connection.on('speaking', (user, speaking) => {
        const ubtn = members.get(user.id);

        ubtn?.setStyleSheet(
          speaking.bitfield === 1 ? '#Avatar { border: 2px solid #43b581; }' : ''
        );
      });
    }

    if (!n.member) {
      return;
    }

    if (n.connection && n.channel !== this.channel) {
      this.channel = n.channel || undefined;
      initChannel.call(this);
      show.call(this);

      return;
    }

    if (o.channel !== this.channel && n.channel === this.channel) {
      addMember.call(this, n.member);

      return;
    }

    if (o.member?.user === app.client.user && !n.channel) {
      this.channel = undefined;
      hide.call(this);

      return;
    }

    if (o.channel === this.channel && n.channel !== this.channel) {
      removeMember.call(this, n.member);
    }
  }

  private initWindow() {
    const { layout } = this;

    this.setLayout(layout);

    layout.setContentsMargins(10, 10, 10, 10);
    layout.setSpacing(5);
    layout.addStretch(1);

    if (!existsSync(stylePath)) {
      error("Overlay couldn't find the theme.");

      return;
    }

    readFile(stylePath, 'utf8')
      .then((css) => this.setStyleSheet(css))
      .catch(error);
  }

  private addMember(member: GuildMember) {
    const { layout, members } = this;
    const widget = new OverlayMember(member);

    members.set(member.id, widget);

    layout.insertWidget(0, widget, 0);

    return widget;
  }

  private removeMember(member: GuildMember) {
    const { layout, members } = this;

    const widget = members.get(member.id);

    if (widget) {
      widget.close();
      layout.removeWidget(widget);
    }
  }

  private initChannel() {
    const { addMember, channel, layout, members } = this;

    if (!channel) {
      return;
    }

    for (const widget of members.values()) {
      widget.close();
      layout.removeWidget(widget);
    }

    this.members = channel.members.mapValues(addMember.bind(this));
  }
}
