import { Direction, QBoxLayout, QWidget } from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { DColorButton } from '../DColorButton/DColorButton';
import { DColorButtonColor } from '../DColorButton/DColorButtonColor';

export class GuildActionsMenu extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  guild?: Guild;

  constructor() {
    super();
    this.setObjectName('ActionsMenu');
    this.initComponent();
    this.setLayout(this.layout);
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      if (options.guild) this.guild = options.guild;
      else if (options.channel) this.guild = options.channel.guild;
    });
  }

  private initComponent() {
    const { layout } = this;
    layout.setContentsMargins(16, 16, 16, 16);
    const leavebtn = new DColorButton(DColorButtonColor.RED);
    leavebtn.setText(__('LEAVE_SERVER'));
    leavebtn.setMinimumSize(0, 32);
    leavebtn.addEventListener('clicked', () => {
      this.guild?.leave();
      app.emit(Events.SWITCH_VIEW, 'dm');
    });
    layout.addWidget(leavebtn);
  }
}
