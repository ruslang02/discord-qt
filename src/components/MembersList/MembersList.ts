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
import { Collection, Snowflake, User, GuildMember, NewsChannel, TextChannel } from 'discord.js';

import { app, MAX_QSIZE } from '../..';
import { GroupDMChannel } from '../../patches/GroupDMChannel';
import { createLogger } from '../../utilities/Console';
import { Events } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';
import { UserButton } from '../UserButton/UserButton';

const { debug } = createLogger('MembersList');

export class MembersList extends QListWidget {
  private channel?: GroupDMChannel | TextChannel | NewsChannel;

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
      if (view === 'guild' && options?.channel) {
        if (this.isShown && options.channel !== this.channel) {
          this.loadList(options.channel as TextChannel);
        }

        this.channel = options.channel as TextChannel;
        this.viewHidden = false;
      } else if (view === 'dm' && options?.dm?.type === 'group') {
        if (this.isShown && options.dm !== this.channel) {
          this.loadList(options.dm);
        }

        this.channel = options.dm;
        this.viewHidden = false;
      } else {
        this.viewHidden = true;
      }

      this.updateVisibility();
    });

    app.on(Events.CONFIG_UPDATE, (config) => {
      this.configHidden = config.get('hideMembersList');
      this.updateVisibility();
    });
  }

  private updateVisibility() {
    if (this.isShown === this.isVisible()) return;

    if (this.isShown) {
      this.show();

      if (this.channel) {
        this.loadList(this.channel);
      }
    } else {
      this.hide();
    }
  }

  private loadList(channel: MembersList['channel']) {
    if (!channel || !['group', 'text', 'news'].includes(channel.type)) {
      return;
    }

    debug(`Loading members list for #${channel.name} (${channel.id})...`);

    // GuildChannel uses members while GroupDMChannel uses recipients,
    // So we merge them into one variable
    let users = new Collection<Snowflake, User | GuildMember>();

    if (this.channel instanceof GroupDMChannel) {
      users = this.channel?.recipients;
    } else if (this.channel?.members) {
      users = this.channel?.members;
    }

    users.forEach((member) => {
      UserButton.deleteInstance(member);
    });

    this.channel = channel;

    this.nodeChildren.clear();
    this.clear();

    if (channel instanceof GroupDMChannel) {
      users = channel?.recipients;
    } else if (channel?.members) {
      users = channel?.members;
    }

    for (const user of users.values()) {
      const btn = UserButton.createInstance(this, user);
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
