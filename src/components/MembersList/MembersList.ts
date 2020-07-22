import { QWidget, QScrollArea, QBoxLayout, Direction, Shape } from '@nodegui/nodegui';
import { MAX_QSIZE, app } from '../..';
import { Guild, TextChannel, Channel } from 'discord.js';
import './MembersList.scss';
import { UserButton } from '../UserButton/UserButton';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';

export class MembersList extends QScrollArea {
  layout = new QBoxLayout(Direction.TopToBottom);
  root = new QWidget();
  cancelToken?: CancelToken;

  constructor() {
    super();

    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.initComponent();

    app.on('switchView', (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options?.channel) return;
      if (this.cancelToken) this.cancelToken.cancel();
      const cancel = new CancelToken();
      this.loadList(options.channel, cancel);
      this.cancelToken = cancel;
    })
  }

  private initComponent() {
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);
  }

  private async loadList(channel: TextChannel, token: CancelToken) {
    if (token.cancelled) return;
    this.takeWidget();
    this.layout = new QBoxLayout(Direction.TopToBottom);
    this.root = new QWidget();
    this.root.setObjectName('MembersList');
    this.layout.setContentsMargins(8, 8, 0, 8);
    this.layout.setSpacing(0);
    this.root.setLayout(this.layout);
    this.setWidget(this.root);
    if (token.cancelled) return;
    const members = channel.members.array();
    for (const member of members) {
      if (token.cancelled) return;
      const btn = new UserButton(this.root);
      btn.loadUser(member, token);
      btn.setMinimumSize(224, 42);
      btn.setMaximumSize(224, 42);
      btn.addEventListener('clicked', async () => {
        app.emit('switchView', 'dm', { dm: await member.createDM() });
      });
      this.layout.addWidget(btn);
    }
    this.layout.addStretch(1);
  }
}