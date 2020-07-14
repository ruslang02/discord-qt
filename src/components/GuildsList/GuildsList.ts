import { QWidget, FlexLayout, QPixmap, QLabel, QIcon, QSize, QPushButton, QScrollArea, QFont, TextFormat, AlignmentFlag, QCursor, CursorShape } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';
import { Guild, Client } from "discord.js";
import { app } from "../..";
import { roundifyPng } from "../../utilities/RoundifyPng";
import { httpsGet } from "../../utilities/HttpsGet";

export class GuildsList extends QScrollArea {
  guilds: Map<Guild, QWidget> = new Map();
  container: QWidget = new QWidget();

  constructor() {
    super();

    this.initializeComponents();
    this.addMainPageButton();

    app.on('clientNew', (client: Client) => {
      client.on('ready', this.loadGuilds.bind(this));
    })
  }

  initializeComponents() {
    this.setLayout(new FlexLayout());
    this.container.setLayout(new FlexLayout());
    this.container.setObjectName("GuildsList");
    this.setWidget(this.container);
  }

  addMainPageButton() {
    const mainIcon = new QIcon(path.resolve(__dirname, "../assets/images/home.png"));
    const mpBtn = new QPushButton();
    mpBtn.setObjectName("PageButton");
    mpBtn.setIcon(mainIcon);
    mpBtn.setIconSize(new QSize(28, 28));
    mpBtn.setFixedSize(48, 48 + 10);
    mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.container.layout?.addWidget(mpBtn);

    const hr = new QLabel();
    hr.setObjectName('Separator');
    hr.setFixedSize(33, 9);
    this.container.layout?.addWidget(hr);
  }

  update() {
  }

  private async getImageBufferFromURL(url: string | null): Promise<Buffer | false> {
    const result = await httpsGet(url);
    if(result === false) return false;
    if (!app.config.roundifyAvatars) return result;
    return roundifyPng(result);
  }

  async loadGuilds() {
    const { client } = app;

    this.guilds.forEach(g => this.container.layout?.removeWidget(g));
    this.guilds.clear();

    client.guilds
      .sort((a, b) => a.position - b.position)
      .forEach(guild => {
        this.getImageBufferFromURL(guild.iconURL)
          .then(imageBuffer => {
            if (!imageBuffer) {
              const text = guild.name.split(' ').map(r => r[0].toUpperCase()).join('');
              guildElem.setText(text);
              guildElem.setFont(new QFont('sans-serif', 18));
              guildElem.setAlignment(AlignmentFlag.AlignCenter);
            }
            else {
              const guildImage = new QPixmap();
              guildImage.loadFromData(imageBuffer, 'PNG');
              guildElem.setPixmap(guildImage.scaled(48, 48));
            }
          });
        const guildElem = new QLabel();
        guildElem.setObjectName("PageButton");
        guildElem.setFixedSize(48, 48 + 10);
        guildElem.setCursor(new QCursor(CursorShape.PointingHandCursor));
        this.container.layout?.addWidget(guildElem);
        this.guilds.set(guild, guildElem);
      });

  }
}