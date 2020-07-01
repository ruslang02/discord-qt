import { QWidget, FlexLayout, QPixmap, QLabel, QPainter } from "@nodegui/nodegui";
import { Guild } from "discord.js";
import path from "path";

export class GuildsList extends QWidget {
  private guilds: Guild[] = [];

  constructor() {
    super();

    this.initializeComponents();
    this.loadVirtualGuilds();
  }

  initializeComponents() {
    this.setInlineStyle(`
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
      flex-direction: column;
    `);
    this.setLayout(new FlexLayout());
  }

  private loadVirtualGuilds() {
    const guildIcon = new QPixmap(path.resolve(__dirname, "../assets/images/logo.png")).scaled(48, 48);
    const guildLabel = new QLabel();
    guildLabel.setPixmap(guildIcon);
    this.layout?.addWidget(guildLabel);
  }
}