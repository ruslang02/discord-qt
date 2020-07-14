import { QWidget, FlexLayout, QPixmap, QLabel, QIcon, QSize, QPushButton, QScrollArea, QFont, TextFormat, AlignmentFlag, QCursor, CursorShape } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';
import { Guild } from "discord.js";
import { Application } from "../..";
import https from "https";
import { PNG, Metadata } from 'pngjs';

export class GuildsList extends QScrollArea {
  guilds: Map<Guild, QWidget> = new Map();
  container: QWidget = new QWidget();

  constructor() {
    super();

    this.initializeComponents();
    this.addMainPageButton();
  }

  initializeComponents() {
    this.setLayout(new FlexLayout());
    this.container.setLayout(new FlexLayout());
    this.container.setObjectName("GuildsList");
    this.setWidget(this.container);
  }

  addMainPageButton() {
    const mainIcon = new QIcon(path.resolve(__dirname, "../assets/images/home.png"));
    const mainLabelButton = new QPushButton();
    mainLabelButton.setObjectName("PageButton");
    mainLabelButton.setIcon(mainIcon);
    mainLabelButton.setIconSize(new QSize(28, 28));
    mainLabelButton.setFixedSize(48, 48 + 10);
    mainLabelButton.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.container.layout?.addWidget(mainLabelButton);

    const hr = new QLabel();
    hr.setObjectName('Separator');
    hr.setFixedSize(33, 9);
    this.container.layout?.addWidget(hr);
  }

  update() {
  }

  private getImageBufferFromURL(url: string | null): Promise<Buffer | false> {
    return new Promise((resolve) => {//
      if(url === null) return resolve(false);
      https.get(url.replace('.jpg', '.png'), (res) => {
        const data: Uint8Array[] = []
        res.on('data', chunk => data.push(chunk));
        res.on('error', (err) => {console.error(err); resolve(false);});
        res.on('end', () => {
          const buf = Buffer.concat(data);
          new PNG({filterType: 4}).parse(buf, (err, that) => {
            if(err) return console.error(err);
            for (var y = 0; y < that.height; y++) {
              for (var x = 0; x < that.width; x++) {
                var idx = (that.width * y + x) << 2;
                var radius = that.height / 2;
                if (y >= Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2)) + radius || y <= -(Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2))) + radius) {
                  that.data[idx + 3] = 0;
                }
              }
            }
            resolve(PNG.sync.write(that));
          }).on('error', (err) => {console.error(err);});
        })
      }).on('error', (err) => {console.error(err); resolve(false);})
    })
  }

  async loadVirtualGuilds() {
    const { Client: client } = Application;
    client.guilds.forEach(guild => {
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
          this.container.layout?.addWidget(guildElem);
        });
      const guildElem = new QLabel();
      guildElem.setObjectName("PageButton");
      guildElem.setFixedSize(48, 48 + 10);
      guildElem.setCursor(new QCursor(CursorShape.PointingHandCursor));
    });

  }
}