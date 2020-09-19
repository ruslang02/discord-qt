import {
  AlignmentFlag, CursorShape, Direction, QBoxLayout, QLabel, QPixmap, QWidget, WidgetEventTypes,
} from '@nodegui/nodegui';
import { join } from 'path';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { DTitleBar } from '../DTitleBar/DTitleBar';
import { ChannelsList } from './ChannelsList';
import { GuildActionsMenu } from './GuildActionsMenu';

export class GuildPanel extends QWidget {
  private titleBar = new DTitleBar();

  private actionsMenu = new GuildActionsMenu();

  private guildel = new QLabel();

  private channelsList = new ChannelsList();

  private controls = new QBoxLayout(Direction.TopToBottom);

  private iopen = new QPixmap(join(__dirname, './assets/icons/close.png')).scaled(24, 24, 1, 1);

  private iclosed = new QPixmap(join(__dirname, './assets/icons/chevron-down.png')).scaled(24, 24, 1, 1);

  private guildow = new QLabel();

  constructor() {
    super();

    this.initComponent();
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      if (options.guild) this.guildel.setText(options.guild.name);
      else if (options.channel) this.guildel.setText(options.channel.guild.name);
      this.setShowActionsMenu(false);
    });
  }

  private _isShown = false;

  private setShowActionsMenu(show?: boolean) {
    const {
      actionsMenu, guildow, iopen, iclosed,
    } = this;
    let value = show;
    if (value === undefined) value = !this._isShown;
    this._isShown = value;
    if (this._isShown) actionsMenu.show(); else actionsMenu.hide();
    guildow.setPixmap(this._isShown ? iopen : iclosed);
  }

  private initComponent() {
    const {
      titleBar, actionsMenu, channelsList, controls, guildel, guildow, iclosed,
    } = this;
    this.setLayout(controls);
    this.setObjectName('GuildPanel');

    guildel.setObjectName('GuildLabel');
    guildel.setAlignment(AlignmentFlag.AlignVCenter);
    guildow.setPixmap(iclosed);
    titleBar.addEventListener(WidgetEventTypes.MouseButtonPress, () => this.setShowActionsMenu());
    guildow.setInlineStyle('background: none; border: none;');
    titleBar.layout?.setContentsMargins(16, 0, 16, 0);
    titleBar.layout?.addWidget(guildel, 1);
    titleBar.layout?.addWidget(guildow);
    titleBar.setCursor(CursorShape.PointingHandCursor);
    titleBar.setMinimumSize(0, 48);

    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);

    actionsMenu.hide();

    [titleBar, actionsMenu]
      .forEach((w) => controls.addWidget(w));
    controls.addWidget(channelsList, 1);
    titleBar.raise();
  }
}
