import { QAction, QClipboardMode, QMenu, QPoint, WidgetAttribute } from '@nodegui/nodegui';
import { app } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { Events as AppEvents } from '../../utilities/Events';
import { PhraseID } from '../../utilities/PhraseID';
import { __ } from '../../utilities/StringProvider';

export class GDMContextMenu extends QMenu {
  private channel?: GroupDMChannel;

  private items = new Map<string, QAction>();

  constructor(parent?: any) {
    super(parent);

    this.setInlineStyle('border-radius: 4px');
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.initItems();

    app.on(AppEvents.OPEN_GDM_MENU, this.popout.bind(this));
  }

  /**
   * Add a clickable button to the context menu
   * @param id Translation ID, also used in this.items
   * @param callback Callback
   */
  private addSimpleItem(id: PhraseID, callback: () => void) {
    const item = new QAction();

    item.setText(__(id));
    item.addEventListener('triggered', callback);

    this.addAction(item);
    this.items.set(id, item);
  }

  private initItems() {
    const { clipboard } = app;

    this.addSimpleItem('MUTE', async () => {
      if (!this.channel) {
        return;
      }

      this.channel.muted = !this.channel.muted;
    });

    this.items.set('LEAVE_SEPARATOR', this.addSeparator());

    this.addSimpleItem('LEAVE_GROUP', async () => {
      if (!this.channel) {
        return;
      }

      app.window.dialogs.confirmLeaveGDM.open(this.channel);
    });

    this.items.set('LAST_SEPARATOR', this.addSeparator());

    this.addSimpleItem('COPY_ID', async () => {
      if (!this.channel) {
        return;
      }

      clipboard.setText(this.channel.id, QClipboardMode.Clipboard);
    });
  }

  private updateVisibility() {
    const { channel } = this;

    this.items.get('MUTE')?.setText(__(!channel || !channel.muted ? 'MUTE' : 'UNMUTE'));
  }

  popout(channel: GroupDMChannel, point: QPoint) {
    this.channel = channel;
    this.updateVisibility();
    super.popup(point);
  }
}
