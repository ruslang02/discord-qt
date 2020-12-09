import { CursorShape, QLabel, QPoint, TextInteractionFlag } from '@nodegui/nodegui';
import { DMChannel, Guild, GuildChannel, TextChannel } from 'discord.js';
import open from 'open';
import { basename, extname } from 'path';
import { URL } from 'url';
import { __ } from '../../utilities/StringProvider';
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { MarkdownStyles } from '../../utilities/MarkdownStyles';

export class DLabel extends QLabel {
  private p0 = new QPoint(0, 0);

  constructor(parent?: any) {
    super(parent);

    this.setWordWrap(true);
    this.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    this.setCursor(CursorShape.IBeamCursor);
    this.addEventListener('linkActivated', this.handleLinkActivated.bind(this));
    this.addEventListener('linkHovered', this.handleLinkHovered.bind(this));
  }

  private async handleLinkActivated(link: string) {
    if (!link || link === '#') {
      return;
    }

    const url = new URL(link);

    switch (true) {
      case url.protocol === 'dq-user:': {
        // @User#1234 links
        app.emit(
          Events.OPEN_USER_PROFILE,
          url.hostname,
          app.currentGuildId,
          this.mapToGlobal(this.p0)
        );

        break;
      }

      case url.protocol === 'dq-channel:': {
        // #channel links
        const channel = (await app.client.channels.fetch(url.hostname)) as TextChannel;

        app.emit(Events.SWITCH_VIEW, 'guild', {
          guild: channel.guild,
          channel,
        });

        break;
      }

      case url.hostname === 'discord.gg': {
        // Invites
        void app.window.dialogs.acceptInvite.checkInvite(link);
        break;
      }

      case /discord(app)?\.com/g.test(url.hostname) &&
        url.pathname.startsWith('/channels') &&
        !url.pathname.includes('settings'): {
        // Links to a message
        const [guildId, channelId] = url.pathname.slice(1).split('/');
        const viewType = guildId === '@me' ? 'dm' : 'guild';

        app.emit(Events.SWITCH_VIEW, viewType, {
          dm: <DMChannel>app.client.channels.resolve(channelId) || undefined,
          guild: guildId === '@me' ? undefined : <Guild>app.client.guilds.resolve(guildId),
          channel: <GuildChannel>app.client.channels.resolve(channelId),
        });

        break;
      }

      default: {
        void open(link);
      }
    }
  }

  private handleLinkHovered(link: string) {
    if (!link || link === '#') {
      this.setProperty('toolTip', '');

      return;
    }

    const uri = new URL(link);
    const name = uri.searchParams.get('emoji_name');

    // Hover over an emoji
    if (name) {
      const id = basename(uri.pathname, extname(uri.pathname));
      const emoji = app.client.emojis.resolve(id);
      const serverName = emoji?.guild.name;

      this.setProperty(
        'toolTip',
        `<html><b>:${name}:</b><br />
        ${
          serverName
            ? `${__('EMOJI_POPOUT_JOINED_GUILD_EMOJI_DESCRIPTION')} <b>${serverName}</b>`
            : __('EMOJI_POPOUT_PREMIUM_UNJOINED_PRIVATE_GUILD_DESCRIPTION')
        }
          </html>`
      );
    }
  }

  setText(text: string) {
    super.setText(`<html>${MarkdownStyles}${text}</html>`);
  }

  setPlainText(text: string) {
    super.setText(text);
  }
}
