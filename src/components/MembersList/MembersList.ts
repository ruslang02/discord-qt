import { Shape, QListWidget, QListWidgetItem, QSize, ScrollBarPolicy, QBrush, QColor, BrushStyle } from '@nodegui/nodegui';
import { TextChannel } from 'discord.js';
import { MAX_QSIZE, app } from '../..';
import { UserButton } from '../UserButton/UserButton';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';
import { Events } from '../../structures/Events';
import './MembersList.scss';

export class MembersList extends QListWidget {
  private cancelToken?: CancelToken;
  private channel?: TextChannel;

  constructor() {
    super();
    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.setSelectionRectVisible(false);
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);

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

  private async loadList(channel: TextChannel, token: CancelToken) {
    this.channel = channel;
    this.clear();
    if (token.cancelled) return;
    for (const member of channel.members.values()) {
      if (token.cancelled) return;
      const btn = new UserButton(this);
      const item = new QListWidgetItem();
      item.setSizeHint(new QSize(224, 44));
      item.setFlags(0);
      item.setBackground(new QBrush(new QColor('transparent'), BrushStyle.NoBrush));
      btn.loadUser(member);
      btn.addEventListener('clicked', async () => {
        app.emit(Events.SWITCH_VIEW, 'dm', { dm: await member.createDM() });
      });
      btn.loadAvatar();
      this.addItem(item);
      this.setItemWidget(item, btn);
    }
  }
}