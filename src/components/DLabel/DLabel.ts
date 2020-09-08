import { CursorShape, QLabel, TextInteractionFlag, WidgetEventTypes } from "@nodegui/nodegui";
import { TextChannel } from "discord.js";
import { app } from "../..";
import { Events } from "../../structures/Events";
import { MarkdownStyles } from "../../structures/MarkdownStyles";

export class DLabel extends QLabel {
  constructor(parent?: any) {
    super(parent);
    this.setWordWrap(true);
    this.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    this.setCursor(CursorShape.IBeamCursor);
    this.addEventListener('linkActivated', this.handleLinkActivated.bind(this));
    this.addEventListener('linkHovered', this.handleLinkHovered.bind(this));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setProperty('toolTip', ''));
  }

  private async handleLinkActivated(link: string) {
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
    else open(link);
  }

  private handleLinkHovered(link: string) {
    try {
      const uri = new URL(link);
      const name = uri.searchParams.get('emojiname');
      if (name) this.setProperty('toolTip', `:${name}:`);
    } catch (e) { }
  }

  setText(text: string) {
    super.setText(MarkdownStyles + text);
  }
}