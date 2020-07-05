import { QWidget, FlexLayout, QPixmap, QLabel } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';

export class GuildsList extends QWidget {
  constructor() {
    super();

    this.initializeComponents();
    this.loadVirtualGuilds();
  }

  initializeComponents() {
    this.setLayout(new FlexLayout());
    this.setObjectName("GuildsList");
  }

  private loadVirtualGuilds() {
    const guildIcon = new QPixmap(path.resolve(__dirname, "../assets/images/logo.png")).scaled(48, 48);
    const guildLabel = new QLabel();
    guildLabel.setPixmap(guildIcon);
    this.layout?.addWidget(guildLabel);
  }
}