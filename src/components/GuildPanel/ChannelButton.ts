import { DChannelButton } from '../DChannelButton/DChannelButton';
import { QLabel, QIcon, QPixmap, WidgetEventTypes } from '@nodegui/nodegui';
import { join } from 'path';
import { TextChannel } from 'discord.js';

export class ChannelButton extends DChannelButton {
  private chicon = new QLabel();
  private chlabel = new QLabel();
  private pound = new QPixmap(join(__dirname, './assets/icons/pound.png'));

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
  }

  private initComponent() {
    const {chicon, chlabel, pound, layout} = this;
    layout.setSpacing(6);
    chicon.setPixmap(pound);
    chlabel.setInlineStyle('font-size: 16px; line-height: 20px;');
    this.labels.push(chlabel);
    layout.addWidget(chicon);
    layout.addWidget(chlabel, 1);
  }

  loadChannel(channel: TextChannel) {
    this.chlabel.setText(channel.name);
  }
}