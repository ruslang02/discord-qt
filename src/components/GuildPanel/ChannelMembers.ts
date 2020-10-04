import {
  Direction, QBoxLayout, QLabel, QPixmap, QWidget,
} from '@nodegui/nodegui';
import { GuildMember } from 'discord.js';
import {
  Client, Constants, DQConstants, VoiceChannel,
} from 'discord.js';
import { app } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { pictureWorker } from '../../utilities/PictureWorker';
import { DChannelButton } from '../DChannelButton/DChannelButton';

export class ChannelMembers extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private buttons = new WeakMap<GuildMember, DChannelButton>();

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants as unknown as DQConstants;
      client.on(Events.VOICE_STATE_UPDATE, (o, n) => {
        console.log({o, n});
        if (!o.member) return;
        const button = this.buttons.get(o.member);
        if (n.speaking === null && button) {
          this.layout.removeWidget(button);
          button.hide();
        }
        if (o.speaking === null) {
          const btn = this.createButton(o.member);
          this.layout.addWidget(btn);
        }
      });
    });
  }

  private initComponent() {
    const { layout } = this;
    layout.setContentsMargins(36, 0, 0, 8);
    layout.setSpacing(4);
    this.setLayout(layout);
  }

  private createButton(member: GuildMember) {
    const btn = new DChannelButton(this);
    const avatar = new QLabel(btn);
    avatar.setFixedSize(24, 24);
    btn.layout.setSpacing(8);
    btn.setMinimumSize(0, 30);
    btn.layout.setContentsMargins(8, 0, 0, 0);
    const memberName = new QLabel(btn);
    btn.labels.push(memberName);
    memberName.setText(member.nickname || member.user.username);
    btn.layout.addWidget(avatar);
    btn.layout.addWidget(memberName, 1);
    pictureWorker.loadImage(member.user.displayAvatarURL({ format: 'png', size: 256 }))
      .then((path) => avatar.setPixmap(new QPixmap(path).scaled(24, 24, 1, 1)));
    return btn;
  }

  /**
   * Loads channel members.
   * @param channel Voice channel to load members of.
   * @returns Whether the widget should be shown.
   */
  loadChannel(channel: VoiceChannel): boolean {
    if (channel.members.size === 0) return false;

    for (const member of channel.members.values()) {
      const btn = this.createButton(member);
      this.layout.addWidget(btn);
    }
    return true;
  }
}
