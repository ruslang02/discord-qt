import { QWidget, QScrollArea, QBoxLayout, Direction, Shape } from '@nodegui/nodegui';
import { MAX_QSIZE, app } from '../..';
import { Guild, TextChannel } from 'discord.js';
import './MembersList.scss';
import { UserButton } from '../UserButton/UserButton';
import { ViewOptions } from '../../views/ViewOptions';

export class MembersList extends QScrollArea {
  channel?: TextChannel;
  layout = new QBoxLayout(Direction.TopToBottom);
  root = new QWidget();

  constructor() {
    super();

    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.initComponent();

    app.on('switchView', (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options?.channel) return;
      this.channel = options.channel;
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
    this.layout.setContentsMargins(8, 8, 0, 8);
    this.layout.setSpacing(0);
    this.root.setLayout(this.layout);
    this.setWidget(this.root);
    this.channel.guild.members
      .filter(m => m.permissionsIn(this.channel as TextChannel).has('VIEW_CHANNEL'))
      .forEach(member => {
        const btn = new UserButton(this.root);
        btn.loadUser(member);
        btn.setMinimumSize(0, 42);
        btn.setMaximumSize(MAX_QSIZE, 42);
        btn.addEventListener('clicked', async () => {
          app.emit('switchView', 'dm', { dm: await member.createDM() });
        });
        this.layout.addWidget(btn);
      });
    this.layout.addStretch(1);
  }
}