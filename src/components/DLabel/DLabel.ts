import { CursorShape, QLabel, TextInteractionFlag, WidgetEventTypes } from "@nodegui/nodegui";
import { TextChannel } from "discord.js";
import { app } from "../..";
import { Events } from "../../structures/Events";
import { MarkdownStyles } from "../../structures/MarkdownStyles";
import open from "open";
import { basename, extname } from "path";
import { __ } from "i18n";

export class DLabel extends QLabel {
  constructor(parent?: any) {
    super(parent);
    this.setWordWrap(true);
    this.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    this.setCursor(CursorShape.IBeamCursor);
    this.addEventListener('linkActivated', this.handleLinkActivated.bind(this));
    this.addEventListener('linkHovered', this.handleLinkHovered.bind(this));
  }

  private async handleLinkActivated(link: string) {
    if (!link) return;
    const url = new URL(link);
    if (url.protocol === 'dq-user:') app.emit(Events.OPEN_USER_PROFILE, url.hostname);
    else if (url.protocol === 'dq-channel:') {
      const channel = await app.client.channels.fetch(url.hostname) as TextChannel;
      app.emit(Events.SWITCH_VIEW, 'guild', {
        guild: channel.guild,
        channel
      });
    }
    else if (url.hostname === 'discord.gg') app.window.dialogs.acceptInvite.checkInvite(link)
    else if (
      /discord(app)?\.com/g.test(url.hostname) &&
      url.pathname.startsWith('/channels') &&
      !url.pathname.includes('settings')
    ) {
      const [path, guildId, channelId, messageId] = url.pathname.slice(1).split('/');
      app.emit(Events.SWITCH_VIEW, guildId === '@me' ? 'dm' : 'guild', {
        dm: app.client.channels.resolve(channelId),
        guild: guildId === "@me" ? undefined : app.client.guilds.resolve(guildId),
        channel: app.client.channels.resolve(channelId)
      });
    }
    else open(link);
  }

  private handleLinkHovered(link: string) {
    if (!link) return this.setProperty('toolTip', '');
    const uri = new URL(link);
    const name = uri.searchParams.get('emoji_name');
    const id = basename(uri.pathname, extname(uri.pathname));
    if (name) {
      const emoji = app.client.emojis.resolve(id);
      const serverName = emoji?.guild.name;
      this.setProperty('toolTip', `<html><b>:${name}:</b><br />
        ${serverName ?
          `${__('EMOJI_POPOUT_JOINED_GUILD_EMOJI_DESCRIPTION')} <b>${serverName}</b>` :
          __('EMOJI_POPOUT_PREMIUM_UNJOINED_PRIVATE_GUILD_DESCRIPTION')
        }
          </html>`);
    }
  }

  setText(text: string) {
    super.setText(`<html>${MarkdownStyles}${text}</html>`);
  }
}