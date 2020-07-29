import { QWidget, QScrollArea, QBoxLayout, Direction, Shape } from '@nodegui/nodegui';
import { MAX_QSIZE, app } from '../..';
import { Guild, TextChannel, Channel } from 'discord.js';
import './MembersList.scss';
import { UserButton } from '../UserButton/UserButton';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';
import { Events } from '../../structures/Events';

export class MembersList extends QScrollArea {
  layout = new QBoxLayout(Direction.TopToBottom);
  root = new QWidget();
  cancelToken?: CancelToken;
  private channel?: TextChannel;

  constructor() {
    super();

    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.initComponent();

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view === 'dm') return this.hide();
      if (view !== 'guild' || !options?.channel) return;
      if (this.cancelToken) this.cancelToken.cancel();
      const cancel = new CancelToken();
      if(options.channel !== this.channel)
        this.loadList(options.channel, cancel);
      this.cancelToken = cancel;
      this.show()
    })
  }

  private initComponent() {
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);
  }

  private async loadList(channel: TextChannel, token: CancelToken) {
    if (token.cancelled) return;
    this.channel = channel;
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
      btn.loadUser(member);
      btn.addEventListener('clicked', async () => {
        app.emit(Events.SWITCH_VIEW, 'dm', { dm: await member.createDM() });
      });
      btn.loadAvatar();
      this.layout.addWidget(btn);
    }
    this.layout.addStretch(1);
  }
}