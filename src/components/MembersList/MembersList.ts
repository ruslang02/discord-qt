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

  private configHidden = false;

  private viewHidden = false;

  private get isShown() {
    return !this.configHidden && !this.viewHidden;
  }

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
        this.viewHidden = true;
      } else if (view === 'guild' && options?.channel) {
        if (this.isShown && options.channel !== this.channel) {
          this.loadList(options.channel);
        }

        this.channel = options.channel as TextChannel;
        this.viewHidden = false;
      }

      this.updateVisibility();
    });

    app.on(Events.CONFIG_UPDATE, (config) => {
      this.configHidden = config.get('hideMembersList');
      this.updateVisibility();
    });
  }

  private updateVisibility() {
    if (this.isShown) {
      this.show();

      if (this.channel) {
        this.loadList(this.channel);
      }
    } else {
      this.hide();
    }
  }

  private loadList(channel: GuildChannel) {
    this.channel = channel as TextChannel | NewsChannel;

    if (!['text', 'news'].includes(channel.type)) {
      return;
    }

    debug(`Loading members list for #${channel.name} (${channel.id})...`);

    this.clear();

    for (const member of channel.members.values()) {
      const btn = UserButton.createInstance(this, member);
      const item = new QListWidgetItem();

      item.setSizeHint(new QSize(224, 44));
      item.setFlags(0);
      item.setBackground(new QBrush(new QColor('transparent'), BrushStyle.NoBrush));
      this.addItem(item);
      this.setItemWidget(item, btn);
      void btn.loadAvatar();
    }

    debug('Finished loading members list.');
  }
}
