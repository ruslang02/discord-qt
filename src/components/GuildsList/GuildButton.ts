import {
  AlignmentFlag,
  CursorShape,
  QCursor,
  QLabel,
  QPixmap,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { pictureWorker } from '../../utilities/PictureWorker';

export class GuildButton extends QLabel {
  unreadInd = new QLabel(this);

  constructor(private guild: Guild, parent?: any) {
    super(parent);
    this.setObjectName('PageButton');
    this.setFixedSize(72, 56);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setProperty('toolTip', guild.available ? guild.name : __('GUILD_UNAVAILABLE_HEADER'));
    this.setText(guild.available ? guild.nameAcronym : '!');
    if (!guild.available) {
      this.setInlineStyle('border: 1px solid red');
    }
    this.setAlignment(AlignmentFlag.AlignCenter);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      guild.subscribeToTypingEvent();
      app.emit(Events.SWITCH_VIEW, 'guild', { guild });
    });
    this.addEventListener(WidgetEventTypes.HoverEnter, () => {
      if (this._active === true) {
        return;
      }
      this.unreadInd.move(-4, 14);
      this.unreadInd.resize(8, 20);
    });
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setUnread(this._unread));

    this.unreadInd.setMinimumSize(8, 0);
    this.unreadInd.resize(0, 0);
    this.unreadInd.setObjectName('UnreadIndicator');
    this.unreadInd.move(-4, 20);
    this.setUnread(false);
  }

  hasPixmap = false;

  private _unread = true;

  private _active = false;

  setUnread(value: boolean) {
    let val = value;
    if (this.guild.muted) {
      val = false;
    }
    this._unread = val;
    if (this._active === true) {
      return;
    }
    this.unreadInd.move(-4, 20);
    // this.unreadInd.resize(0, 0);
    this.unreadInd.resize(8, val === true ? 8 : 0);
    this.adjustSize();
  }

  setActive(value: boolean) {
    this._active = value;
    if (value === true) {
      this.unreadInd.move(-4, 4);
      this.unreadInd.resize(8, 40);
    } else {
      this.setUnread(this._unread);
    }
    this.setProperty('active', value);
    this.repolish();
  }

  async loadAvatar() {
    if (this.hasPixmap) {
      return;
    }
    const url = this.guild.iconURL({ size: 256, format: 'png' });
    this.hasPixmap = !!url;
    if (url) {
      pictureWorker
        .loadImage(url)
        .then((path) => this.setPixmap(new QPixmap(path).scaled(48, 48, 1, 1)))
        .catch(() => {
          this.hasPixmap = false;
        });
    }
  }
}
