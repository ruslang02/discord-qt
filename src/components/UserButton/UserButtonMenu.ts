import { QAction, QClipboardMode, QMenu, QPoint } from '@nodegui/nodegui';
import { GuildMember, User } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../utilities/Events';

export class UserButtonMenu extends QMenu {
  private someone?: GuildMember | User;

  constructor(parent?: any) {
    super(parent);
    this.initItems();
  }

  private initItems() {
    const { clipboard } = app;
    {
      const item = new QAction();
      item.setText('Message');
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        app.emit(Events.SWITCH_VIEW, 'dm', {
          dm: await (this.someone instanceof User
            ? this.someone.createDM()
            : this.someone.user?.createDM()),
        });
      });
      this.addAction(item);
    }
    this.addSeparator();
    {
      const item = new QAction();
      item.setText(__('COPY_ID'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        clipboard.setText(this.someone.id, QClipboardMode.Clipboard);
      });
      this.addAction(item);
    }
  }

  popout(someone: User | GuildMember, point: QPoint) {
    super.popup(point);
    this.someone = someone;
  }
}
