import { QWidget, QScrollArea, QBoxLayout, Direction, Shape } from '@nodegui/nodegui';
import { MAX_QSIZE, app } from '../..';
import { Guild, TextChannel } from 'discord.js';
import './MembersList.scss';
import { UserButton } from '../UserButton/UserButton';

export class MembersList extends QScrollArea {
  channel?: TextChannel;
  layout = new QBoxLayout(Direction.TopToBottom);
  root = new QWidget();

  constructor() {
    super();
    
    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.initComponent();

    app.on('guildOpen', (channel: TextChannel) => {
      this.channel = channel;
      this.loadList();
    })
  }

  private initComponent() {
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);
  }

  private async loadList() {
    if (!this.channel) return;
    this.takeWidget();
    this.layout = new QBoxLayout(Direction.TopToBottom);
    this.root = new QWidget();
    this.root.setObjectName('MembersList');
    this.layout.setContentsMargins(8, 0, 0, 8);
    this.layout.setSpacing(0);
    this.root.setLayout(this.layout);
    // await this.channel.fetchMembers('', 50);
    this.channel.members.forEach(member => {
      const btn = new UserButton(this.root);
      btn.loadUser(member);
      this.layout.addWidget(btn);
    });
    this.layout.addStretch(1);
  }
}