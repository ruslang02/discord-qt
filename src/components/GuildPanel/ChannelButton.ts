import { DChannelButton } from '../DChannelButton/DChannelButton';
import { QLabel, QIcon, QPixmap, WidgetEventTypes, ContextMenuPolicy, QMenu, QAction, QApplication, QClipboardMode, QPoint } from '@nodegui/nodegui';
import { join } from 'path';
import { TextChannel } from 'discord.js';

export class ChannelButton extends DChannelButton {
  private chicon = new QLabel();
  private chlabel = new QLabel();
  private pound = new QPixmap(join(__dirname, './assets/icons/pound.png'));
  private clipboard = QApplication.clipboard();
  private channelMenu = new QMenu(this);

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
  }

  private initComponent() {
    const { chicon, chlabel, pound, layout } = this;
    layout.setSpacing(6);
    chicon.setPixmap(pound);
    chlabel.setInlineStyle('font-size: 16px; line-height: 20px;');
    this.labels.push(chlabel);
    layout.addWidget(chicon);
    layout.addWidget(chlabel, 1);
  }

  loadChannel(channel: TextChannel) {
    const { channelMenu } = this;
    this.chlabel.setText(channel.name);
    channelMenu.setInlineStyle('background: #18191c');
    const copyId = new QAction();
    copyId.setText('Copy ID');
    copyId.addEventListener('triggered', () => {
      this.clipboard.setText(channel.id, QClipboardMode.Clipboard);
    });
    channelMenu.addAction(copyId);
    this.addEventListener('customContextMenuRequested', (pos) => {
      channelMenu.setInlineStyle('background: #18191c');
      channelMenu.repolish();
      channelMenu.popup(this.mapToGlobal(new QPoint(pos.x, pos.y)));
    });
  }
}