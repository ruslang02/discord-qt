import {
  BrushStyle,
  QBrush,
  QColor,
  QListWidget,
  QListWidgetItem,
  QSize,
  ScrollBarPolicy,
  Shape,
} from '@nodegui/nodegui';
import { GuildChannel, NewsChannel, TextChannel } from 'discord.js';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { UserButton } from '../UserButton/UserButton';

const { debug } = createLogger('MembersList');
export class MembersList extends QListWidget {
  private channel?: TextChannel | NewsChannel;

  constructor() {
    super();
    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.setSelectionRectVisible(false);
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view === 'dm' || (view === 'guild' && !options?.channel)) {
        this.hide();
        return;
      }
      if (view === 'guild' && options?.channel) {
        if (options.channel !== this.channel) this.loadList(options.channel);
        this.show();
      }
    });
  }

  private ratelimit = false;

  private rateTimer?: any;

  private async loadList(channel: GuildChannel) {
    if (this.ratelimit || this.channel === channel) return;
    this.ratelimit = true;
    if (this.rateTimer) clearTimeout(this.rateTimer);

    debug(`Loading members list for #${channel.name} (${channel.id})...`);
    if (channel.type !== 'text' && channel.type !== 'news') return;
    this.channel = channel as TextChannel | NewsChannel;
    this.clear();
    this.nodeChildren.clear();
    this.items.clear();
    for (const member of channel.members.values()) {
      const btn = UserButton.createInstance(this, member);
      const item = new QListWidgetItem();
      item.setSizeHint(new QSize(224, 44));
      item.setFlags(0);
      item.setBackground(new QBrush(new QColor('transparent'), BrushStyle.NoBrush));
      this.addItem(item);
      this.setItemWidget(item, btn);
      btn.loadAvatar();
    }
    debug('Finished loading members list.');
    this.rateTimer = setTimeout(() => { this.ratelimit = false; }, 500);
  }
}
