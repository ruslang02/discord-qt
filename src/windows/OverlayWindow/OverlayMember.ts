import { AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget } from '@nodegui/nodegui';
import { GuildMember } from 'discord.js';
import { MAX_QSIZE } from '../..';
import { pictureWorker } from '../../utilities/PictureWorker';

export class OverlayMember extends QWidget {
  private avatar = new QLabel(this);

  private name = new QLabel(this);

  layout = new QBoxLayout(Direction.LeftToRight);

  constructor(member: GuildMember) {
    super();

    this.setObjectName('Member');
    this.initComponent();
    void this.loadMember(member);
  }

  private initComponent() {
    const { avatar, layout, name } = this;

    avatar.setFixedSize(36, 36);
    avatar.setObjectName('Avatar');
    avatar.setAlignment(AlignmentFlag.AlignCenter);
    name.setObjectName('Name');
    name.setMaximumSize(150, MAX_QSIZE);

    const nameLayout = new QBoxLayout(Direction.TopToBottom);

    nameLayout.addStretch(1);
    nameLayout.addWidget(name);
    nameLayout.addStretch(1);

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(10);
    layout.addWidget(avatar, 0);
    layout.addLayout(nameLayout, 0);
    layout.addStretch(1);

    this.setLayout(layout);
  }

  private async loadMember(member: GuildMember) {
    const { avatar, name } = this;

    name.setText(member.displayName);

    const path = await pictureWorker.loadImage(
      member.user.displayAvatarURL({
        format: 'png',
        size: 256,
      }),
      { roundify: true }
    );

    avatar.setPixmap(new QPixmap(path).scaled(36, 36, 1, 1));
  }
}
