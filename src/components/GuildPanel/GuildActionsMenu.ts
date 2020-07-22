import { QWidget, QBoxLayout, Direction, QPushButton } from '@nodegui/nodegui';
import { DColorButton, DColorButtonColor } from '../DColorButton/DColorButton';
import { app } from '../..';
import { ViewOptions } from '../../views/ViewOptions';
import { Guild } from 'discord.js';

export class GuildActionsMenu extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);
  guild?: Guild;

  constructor() {
    super();
    this.setObjectName('ActionsMenu');
    this.initComponent();
    this.setLayout(this.layout);
    app.on('switchView', (view:string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      if (options.guild) this.guild = options.guild
      else if (options.channel) this.guild = options.channel.guild;
    })
  }

  private initComponent() {
    const { layout } = this;
    layout.setContentsMargins(16, 16, 16, 16);
    const leavebtn = new DColorButton(DColorButtonColor.RED);
    leavebtn.setText('Leave Server');
    leavebtn.setMinimumSize(0, 32);
    leavebtn.addEventListener('clicked', () => {
      console.log(this.guild);
      this.guild?.leave();
    })
    layout.addWidget(leavebtn);
  }
}