import { QWidget, QPixmap, QLabel, QIcon, QSize, QPushButton, QScrollArea, QFont, AlignmentFlag, QCursor, CursorShape, AspectRatioMode, TransformationMode, QBoxLayout, Direction, Shape, WidgetEventTypes } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';
import { Guild, Client } from "discord.js";
import { app } from "../..";
import { pictureWorker } from "../../utilities/PictureWorker";
import { ViewOptions } from '../../views/ViewOptions';

export class GuildsList extends QScrollArea {
  layout = new QBoxLayout(Direction.TopToBottom);
  private container = new QWidget();
  private mpBtn = new QPushButton();
  private guilds = new Map<Guild, QLabel>();

  constructor() {
    super();

    this.setFrameShape(Shape.NoFrame);
    this.setMinimumSize(72, 0);
    this.initContainer();

    app.on('client', (client: Client) => {
      client.on('ready', this.loadGuilds.bind(this));
    });

    app.on('switchView', (view: string, options?: ViewOptions) => {
      if(!['dm', 'guild'].includes(view)) return;
      this.mpBtn.setProperty('active', false)
      if(view === 'dm')
        this.mpBtn.setProperty('active', true)
      else if(view === 'guild' && options) {
        const guild = options.guild || options.channel?.guild || null;
        if(!guild) return;
        this.guilds.forEach((w, g) => {
          w.setProperty('active', g.id === guild.id ? 'true' : 'false');
          w.repolish();
        });
      }
      this.mpBtn.repolish();
    })
  }

  private addMainPageButton() {
    const mainIcon = new QIcon(path.resolve(__dirname, "./assets/icons/home.png"));
    this.mpBtn = new QPushButton();
    this.mpBtn.setObjectName("PageButton");
    this.mpBtn.setIcon(mainIcon);
    this.mpBtn.setIconSize(new QSize(28, 28));
    this.mpBtn.setFixedSize(48, 48 + 10);
    this. mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.mpBtn.setProperty('toolTip', 'Direct Messages');
    this.mpBtn.setProperty('active', 'true');
    this.mpBtn.addEventListener('clicked', () => app.emit('switchView', 'dm'));

    this.container.layout?.addWidget(this.mpBtn);

    const hr = new QLabel();
    hr.setObjectName('Separator');
    hr.setFixedSize(33, 9);

    this.container.layout?.addWidget(hr);
    this.layout.addStretch(1);
  }
  private initContainer() {
    this.layout = new QBoxLayout(Direction.TopToBottom);
    this.container = new QWidget();
    this.takeWidget();
    this.container.setLayout(this.layout);
    this.container.setObjectName("GuildsList");
    this.layout.setContentsMargins(12, 12, 12, 12);
    this.layout.setSpacing(0);
    this.setWidget(this.container);
    this.addMainPageButton();
  }
  async loadGuilds() {
    const { client } = app;
    this.guilds.clear();
    this.initContainer();

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
              guildElem.setText(guild.nameAcronym);
              guildElem.setAlignment(AlignmentFlag.AlignCenter);
            }
            else {
              const guildImage = new QPixmap();
              guildImage.loadFromData(imageBuffer, 'PNG');
              guildElem.setPixmap(guildImage.scaled(48, 48, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation));
            }
          });
        const guildElem = new QLabel(this.container);
        guildElem.setObjectName("PageButton");
        guildElem.setFixedSize(48, 48 + 10);
        guildElem.setCursor(new QCursor(CursorShape.PointingHandCursor));
        guildElem.setProperty('toolTip', guild.name);
        guildElem.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
          app.emit('switchView', 'guild', { guild });
        });
        this.guilds.set(guild, guildElem);
        this.layout.insertWidget(i+2, guildElem);
      })
  }
}