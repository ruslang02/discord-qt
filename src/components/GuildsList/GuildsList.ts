import { QWidget, QPixmap, QLabel, QIcon, QSize, QPushButton, QScrollArea, QFont, AlignmentFlag, QCursor, CursorShape, AspectRatioMode, TransformationMode, QBoxLayout, Direction, Shape } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';
import { Guild, Client } from "discord.js";
import { app } from "../..";
import { pictureWorker } from "../../utilities/PictureWorker";

export class GuildsList extends QScrollArea {
  layout = new QBoxLayout(Direction.TopToBottom);
  guilds = new Map<Guild, QWidget>();
  container = new QWidget();

  constructor() {
    super();

    this.initializeComponents();
    this.addMainPageButton();

    app.on('client', (client: Client) => {
      client.on('ready', this.loadGuilds.bind(this));
    })
  }

  initializeComponents() {
    this.container.setLayout(this.layout);
    this.container.setObjectName("GuildsList");
    this.layout.setContentsMargins(12, 12, 12, 12);
    this.layout.setSpacing(0);
    this.setFrameShape(Shape.NoFrame);
    this.setMinimumSize(72, 0);
    this.setWidget(this.container);
  }

  addMainPageButton() {
    const mainIcon = new QIcon(path.resolve(__dirname, "./assets/icons/home.png"));
    const mpBtn = new QPushButton();
    mpBtn.setObjectName("PageButton");
    mpBtn.setIcon(mainIcon);
    mpBtn.setIconSize(new QSize(28, 28));
    mpBtn.setFixedSize(48, 48 + 10);
    mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    mpBtn.setProperty('toolTip', 'Direct Messages');
    mpBtn.setProperty('active', 'true');

    this.container.layout?.addWidget(mpBtn);

    const hr = new QLabel();
    hr.setObjectName('Separator');
    hr.setFixedSize(33, 9);

    this.container.layout?.addWidget(hr);
    this.layout.addStretch(1);
  }
  async loadGuilds() {
    const { client } = app;

    this.guilds.forEach(g => this.container.layout?.removeWidget(g));
    this.guilds.clear();

    const guilds = client.guilds
      .sort((a, b) => a.position - b.position)
      .array();
    if(app.config.fastLaunch)
      guilds.length = 5;
    guilds.forEach((guild, i) => {
        pictureWorker.loadImage(guild.iconURL)
          .then(imageBuffer => {
            //console.log(guild.name);
            if (!imageBuffer) {
              const text = guild.name.split(' ').map(r => r[0].toUpperCase()).join('');
              guildElem.setText(text);
              guildElem.setFont(new QFont('sans-serif', 18));
              guildElem.setAlignment(AlignmentFlag.AlignCenter);
            }
            else {
              const guildImage = new QPixmap();
              guildImage.loadFromData(imageBuffer, 'PNG');
              guildElem.setPixmap(guildImage.scaled(48, 48, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation));
            }
          });
        const guildElem = new QLabel();
        guildElem.setObjectName("PageButton");
        guildElem.setFixedSize(48, 48 + 10);
        guildElem.setCursor(new QCursor(CursorShape.PointingHandCursor));
        guildElem.setProperty('toolTip', `<b>${guild.name}</b>`);
        this.layout.insertWidget(i+2, guildElem);
        this.guilds.set(guild, guildElem);
      })
  }
}