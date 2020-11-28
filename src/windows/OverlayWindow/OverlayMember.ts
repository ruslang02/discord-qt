import { Direction, QBoxLayout, QLabel, QWidget } from '@nodegui/nodegui';
import { GuildMember } from 'discord.js';

export class OverlayMember extends QWidget {
  private avatar = new QLabel(this);

  private name = new QLabel(this);

  layout = new QBoxLayout(Direction.LeftToRight);

  constructor(member: GuildMember) {
    super();

    this.setObjectName('Member');
    this.initComponent();
    this.loadMember(member);
  }

  private initComponent() {
    const { avatar, layout, name, setLayout } = this;

    layout.addWidget(avatar, 0);
    layout.addWidget(name, 1);

    setLayout.call(this, layout);
  }

  private loadMember(member: GuildMember) {
    const { name } = this;

    name.setText(member.displayName);
  }
}
