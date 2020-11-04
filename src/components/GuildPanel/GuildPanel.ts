import {
  AlignmentFlag,
  CursorShape,
  Direction,
  MouseButton,
  QBoxLayout,
  QLabel,
  QMouseEvent,
  QPixmap,
  QPoint,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { join } from 'path';
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { DTitleBar } from '../DTitleBar/DTitleBar';
import { ChannelsList } from './ChannelsList';
import { GuildActionsMenu } from './GuildActionsMenu';

export class GuildPanel extends QWidget {
  private titleBar = new DTitleBar();

  private actionsMenu = new GuildActionsMenu(this);

  private guildel = new QLabel(this);

  private channelsList = new ChannelsList();

  private controls = new QBoxLayout(Direction.TopToBottom);

  private iopen = new QPixmap(join(__dirname, './assets/icons/close.png')).scaled(24, 24, 1, 1);

  private iclosed = new QPixmap(join(__dirname, './assets/icons/chevron-down.png')).scaled(24, 24, 1, 1);

  private guildow = new QLabel(this);

  constructor() {
    super();

    this.initComponent();
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      if (options.guild) this.guildel.setText(options.guild.name);
      else if (options.channel) this.guildel.setText(options.channel.guild.name);
      this.actionsMenu.close();
    });
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
    titleBar.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      const event = new QMouseEvent(e as any);
      if (event?.button() !== MouseButton.LeftButton) return;
      actionsMenu.popup(this.channelsList.mapToGlobal(new QPoint(0, 0)));
    });
    guildow.setInlineStyle('background: none; border: none;');
    titleBar.layout?.setContentsMargins(16, 0, 16, 0);
    titleBar.layout?.addWidget(guildel, 1);
    titleBar.layout?.addWidget(guildow);
    titleBar.setCursor(CursorShape.PointingHandCursor);
    titleBar.setMinimumSize(0, 48);

    actionsMenu.setMinimumSize(240, 0);
    actionsMenu.addEventListener(WidgetEventTypes.Show, () => guildow.setPixmap(this.iopen));
    actionsMenu.addEventListener(WidgetEventTypes.Close, () => guildow.setPixmap(this.iclosed));

    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);

    controls.addWidget(titleBar);
    controls.addWidget(channelsList, 1);
    titleBar.raise();
  }
}
