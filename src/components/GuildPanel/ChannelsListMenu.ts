import { QAction, QClipboardMode, QMenu, WidgetAttribute } from '@nodegui/nodegui';
import { GuildChannel } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';

export class ChannelsListMenu extends QMenu {
  channel?: GuildChannel;

  constructor(parent?: any) {
    super(parent);

    this.setInlineStyle('border-radius: 4px');
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.initMenu();
  }

  private initMenu() {
    const copyId = new QAction();
    copyId.setText(__('COPY_ID'));
    copyId.addEventListener('triggered', () => {
      app.clipboard.setText(this.channel?.id || '', QClipboardMode.Clipboard);
    });
    this.addAction(copyId);
  }

  setChannel(channel: GuildChannel) {
    this.channel = channel;
  }
}
