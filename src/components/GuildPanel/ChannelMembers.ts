import {
  Direction, QBoxLayout, QLabel, QPixmap, QWidget,
} from '@nodegui/nodegui';
import { VoiceChannel } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';
import { DChannelButton } from '../DChannelButton/DChannelButton';

export class ChannelMembers extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
  }

  private initComponent() {
    const { layout } = this;
    layout.setContentsMargins(36, 0, 0, 8);
    layout.setSpacing(4);
    this.setLayout(layout);
  }

  /**
   * Loads channel members.
   * @param channel Voice channel to load members of.
   * @returns Whether the widget should be shown.
   */
  loadChannel(channel: VoiceChannel): boolean {
    if (channel.members.size === 0) return false;

    for (const member of channel.members.values()) {
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
      this.layout.addWidget(btn);
      pictureWorker.loadImage(member.user.displayAvatarURL({ format: 'png', size: 256 }))
        .then((path) => avatar.setPixmap(new QPixmap(path).scaled(24, 24, 1, 1)));
    }
    return true;
  }
}
