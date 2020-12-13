import { AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget } from '@nodegui/nodegui';
import { GuildMember } from 'discord.js';
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
    const { avatar, layout, name, setLayout } = this;

    avatar.setFixedSize(24, 24);
    avatar.setObjectName('Avatar');
    avatar.setAlignment(AlignmentFlag.AlignCenter);
    name.setObjectName('Name');

    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(10);
    layout.addWidget(avatar, 0);
    layout.addWidget(name, 1);

    setLayout.call(this, layout);
  }

  private async loadMember(member: GuildMember) {
    const { avatar, name } = this;

    name.setText(member.displayName);

    const path = await pictureWorker.loadImage(
      member.user.displayAvatarURL({
        format: 'png',
        size: 256,
      }),
      { roundify: false }
    );

    avatar.setPixmap(new QPixmap(path).scaled(24, 24, 1, 1));
  }
}
