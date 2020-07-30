import { QLabel, QCursor, CursorShape, AlignmentFlag, WidgetEventTypes, QPixmap } from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { pictureWorker } from '../../utilities/PictureWorker';

export class GuildButton extends QLabel {
  constructor(private guild: Guild, parent?: any) {
    super();
    this.setObjectName("PageButton");
    this.setFixedSize(48, 48 + 10);
    this.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.setProperty('toolTip', guild.name);
    this.setText(guild.nameAcronym);
    this.setAlignment(AlignmentFlag.AlignCenter);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(Events.SWITCH_VIEW, 'guild', { guild });
    });
  }
  private hasPixmap = false;
  async loadAvatar() {
    if (this.hasPixmap) return;
    this.hasPixmap = true;
    pictureWorker.loadImage(this.guild.iconURL({size: 64, format: 'png'}) || '')
      .then(imageBuffer => {
        if (imageBuffer) {
          const guildImage = new QPixmap();
          guildImage.loadFromData(imageBuffer, 'PNG');
          this.setPixmap(guildImage.scaled(48, 48, 1, 1));
        }
      });
  }
}