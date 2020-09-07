import { QLabel, QCursor, CursorShape, AlignmentFlag, WidgetEventTypes, QPixmap } from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { __ } from 'i18n';

export class GuildButton extends QLabel {
  constructor(private guild: Guild, parent?: any) {
    super();
    this.setObjectName("PageButton");
    this.setFixedSize(72, 56);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setProperty('toolTip', guild.available ? guild.name : __('GUILD_UNAVAILABLE_HEADER'));
    this.setText(guild.available ? guild.nameAcronym : '!');
    if (!guild.available) this.setInlineStyle('border: 1px solid red');
    this.setAlignment(AlignmentFlag.AlignCenter);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(Events.SWITCH_VIEW, 'guild', { guild });
    });
  }
  hasPixmap = false;
  async loadAvatar() {
    if (this.hasPixmap) return;
    this.hasPixmap = true;
    pictureWorker.loadImage(this.guild.iconURL({size: 256, format: 'png'}))
      .then(path => {
        if (path) {
          const guildImage = new QPixmap(path);
          this.setPixmap(guildImage.scaled(48, 48, 1, 1));
        }
      });
  }
}