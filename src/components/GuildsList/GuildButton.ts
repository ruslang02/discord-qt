import {
  AlignmentFlag, CursorShape, QCursor, QLabel, QPixmap, WidgetEventTypes,
} from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { pictureWorker } from '../../utilities/PictureWorker';

export class GuildButton extends QLabel {
  unreadInd = new QLabel(this);

  constructor(private guild: Guild, parent?: any) {
    super(parent);
    this.setObjectName('PageButton');
    this.setFixedSize(72, 56);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setProperty('unread', !guild.acknowledged);
    this.setProperty('toolTip', guild.available ? guild.name : __('GUILD_UNAVAILABLE_HEADER'));
    this.setText(guild.available ? guild.nameAcronym : '!');
    if (!guild.available) this.setInlineStyle('border: 1px solid red');
    this.setAlignment(AlignmentFlag.AlignCenter);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(Events.SWITCH_VIEW, 'guild', { guild });
    });

    this.unreadInd.setFixedSize(8, 8);
    this.unreadInd.setObjectName('UnreadIndicator');
    this.unreadInd.move(-4, 20);
    this.setUnread(false);
  }

  hasPixmap = false;

  setUnread(value: boolean) {
    if (value === true) this.unreadInd.show(); else this.unreadInd.hide();
  }

  async loadAvatar() {
    if (this.hasPixmap) return;
    const url = this.guild.iconURL({ size: 256, format: 'png' });
    this.hasPixmap = !!url;
    if (url) {
      pictureWorker.loadImage(url)
        .then((path) => this.setPixmap(new QPixmap(path).scaled(48, 48, 1, 1)))
        .catch(() => { this.hasPixmap = false; });
    }
  }
}
