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
import { NativeRawPointer } from '@nodegui/nodegui/dist/lib/core/Component';
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

  private guildLabel = new QLabel(this);

  private channelsList = new ChannelsList();

  private controls = new QBoxLayout(Direction.TopToBottom);

  private iopen = new QPixmap(join(__dirname, './assets/icons/close.png')).scaled(24, 24, 1, 1);

  private iclosed = new QPixmap(join(__dirname, './assets/icons/chevron-down.png')).scaled(
    24,
    24,
    1,
    1
  );

  private guildow = new QLabel(this);

  constructor() {
    super();

    this.initComponents();

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) {
        return;
      }

      if (options.guild) {
        this.guildLabel.setText(options.guild.name);
      } else if (options.channel) {
        this.guildLabel.setText(options.channel.guild.name);
      }

      this.actionsMenu.close();
    });
  }

  private initComponents() {
    const { titleBar, actionsMenu, controls, guildLabel, guildow } = this;

    this.setObjectName('GuildPanel');

    guildLabel.setObjectName('GuildLabel');
    guildLabel.setAlignment(AlignmentFlag.AlignVCenter);

    guildow.setPixmap(this.iclosed);
    guildow.setInlineStyle('background: none; border: none;');

    actionsMenu.setMinimumSize(240, 0);
    actionsMenu.addEventListener(WidgetEventTypes.Show, () => guildow.setPixmap(this.iopen));
    actionsMenu.addEventListener(WidgetEventTypes.Close, () => guildow.setPixmap(this.iclosed));

    titleBar.layout?.setContentsMargins(16, 0, 16, 0);
    titleBar.layout?.addWidget(guildLabel, 1);
    titleBar.layout?.addWidget(guildow);

    titleBar.setCursor(CursorShape.PointingHandCursor);
    titleBar.setMinimumSize(0, 48);
    titleBar.addEventListener(
      WidgetEventTypes.MouseButtonPress,
      (e?: NativeRawPointer<'QEvent'>) => {
        if (!e) {
          return;
        }

        const event = new QMouseEvent(e);

        if (event?.button() === MouseButton.LeftButton) {
          actionsMenu.popup(this.channelsList.mapToGlobal(new QPoint(0, 0)));
        }
      }
    );

    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);
    controls.addWidget(titleBar);
    controls.addWidget(this.channelsList, 1);

    this.setLayout(controls);

    titleBar.raise();
  }
}
