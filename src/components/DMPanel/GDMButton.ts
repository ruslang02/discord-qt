import { ContextMenuPolicy, QPoint } from '@nodegui/nodegui';
import { app } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { __ } from '../../utilities/StringProvider';
import { BaseUserButton } from '../UserButton/BaseUserButton';

const { error } = createLogger('GDMButton');

/**
 * Represents a button with user's avatar, name and current status.
 */
export class GDMButton extends BaseUserButton {
  private hasPixmap = false;

  channel: GroupDMChannel;

  constructor(groupChannel: GroupDMChannel, parent?: any) {
    super(parent);

    this.channel = groupChannel;

    void this.loadName();
    void this.loadStatus();

    this.addEventListener('clicked', () => {
      app.emit(AppEvents.SWITCH_VIEW, 'dm', { dm: this.channel });
    });

    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener('customContextMenuRequested', ({ x, y }: { x: number; y: number }) => {
      app.emit(AppEvents.OPEN_GDM_MENU, this.channel, this.mapToGlobal(new QPoint(x, y)));
    });
  }

  get name() {
    return this.channel.name;
  }

  /**
   * Loads group DM's icon
   */
  async loadAvatar() {
    if (!app.config.get('enableAvatars') || this.hasPixmap) {
      return;
    }

    this.hasPixmap = true;

    try {
      const path = await pictureWorker.loadImage(
        this.channel.iconURL({ format: 'png', size: 256 })
      );

      this.setAvatar(path);
    } catch (e) {
      this.hasPixmap = false;
      error(`Could not load icon on group DM ${this.channel.id}`);
    }
  }

  /**
   * Renders number of members in the group DM
   */
  async loadStatus() {
    if (this.native.destroyed) {
      return;
    }

    const { size } = this.channel.recipients;
    let status: string;

    if (size > 1) {
      status = __('ONE_MEMBER');
    } else {
      status = __('NUMBER_MEMBERS', {
        num: size,
      });
    }

    this.setStatus(status);
  }

  /**
   * Renders name of the group DM, either a custom one or the recipients' pseudos
   */
  async loadName() {
    this.setName(this.channel.name);
  }
}
