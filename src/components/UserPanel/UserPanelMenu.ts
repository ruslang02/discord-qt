import {
  QAction, QIcon, QMenu, WidgetAttribute,
} from '@nodegui/nodegui';
import { PresenceStatusData } from 'discord.js';
import { __ } from 'i18n';
import { join } from 'path';
import { app } from '../..';

export class UserPanelMenu extends QMenu {
  constructor(parent?: any) {
    super(parent);
    this.initMenu();
    this.setInlineStyle('border-radius: 4px');
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.setMinimumSize(220, 0);
  }

  private initMenu() {
    for (const status of (<PresenceStatusData[]>['online', 'idle', 'dnd', 'invisible'])) {
      const item = new QAction();
      item.setText(__(`STATUS_${status.toUpperCase()}`));
      item.setIcon(new QIcon(join(__dirname, `assets/icons/status-${status}.png`)));
      item.addEventListener('triggered', () => app.client.user?.setPresence({ status }));
      this.addAction(item);
      // @ts-ignore
      this.nodeParent.updatePresence();
    }
    this.addSeparator();
    {
      const item = new QAction();
      item.setText(__('CUSTOM_STATUS_EDIT_CUSTOM_STATUS_PLACEHOLDER'));
      item.setIcon(new QIcon(join(__dirname, 'assets/icons/emoticon-outline.png')));
      item.addEventListener('triggered', () => app.window.dialogs.customStatus.show());
      this.addAction(item);
    }
  }
}
