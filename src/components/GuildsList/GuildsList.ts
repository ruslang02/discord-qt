import { QWidget, QPixmap, QLabel, QIcon, QSize, QPushButton, QScrollArea, AlignmentFlag, QCursor, CursorShape, QBoxLayout, Direction, Shape, WidgetEventTypes } from "@nodegui/nodegui";
import path from "path";
import './GuildsList.scss';
import { Guild, Client } from "discord.js";
import { app } from "../..";
import { pictureWorker } from "../../utilities/PictureWorker";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";

export class GuildsList extends QScrollArea {
  layout = new QBoxLayout(Direction.TopToBottom);
  private container = new QWidget();
  private mpBtn = new QPushButton();
  private hr = new QLabel();
  private mainIcon = new QIcon(path.resolve(__dirname, "./assets/icons/home.png"));
  private guilds = new WeakMap<Guild, QLabel>();
  private active?: QPushButton | QLabel;

  constructor() {
    super();

    this.setFrameShape(Shape.NoFrame);
    this.setMinimumSize(72, 0);
    this.initContainer();
    this.addMainPageButton();

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('ready', this.loadGuilds.bind(this));
      client.on('guildDelete', (guild: Guild) => {
        const entry = this.guilds.get(guild);
        if (!entry) return;
        entry.hide();
        this.layout.removeWidget(entry);
      });
      client.on('guildCreate', (guild: Guild) => {
        this.loadGuild(guild, 0);
      });
    });

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      this.layout.update();
      if (!['dm', 'guild'].includes(view)) return;
      this.mpBtn.setProperty('active', false)
      if (view === 'dm') {
        this.active?.setProperty('active', false);
        this.active?.repolish();
        this.mpBtn.setProperty('active', true);
        this.active = this.mpBtn;
        this.active.repolish();
      } else if (view === 'guild' && options) {
        const guild = options.guild || options.channel?.guild || null;
        if (!guild) return;
        this.active?.setProperty('active', false);
        this.active?.repolish();
        const active = this.guilds.get(guild);
        active?.setProperty('active', false);
        this.active = active;
        this.active?.repolish();
      }
    })
  }

  private addMainPageButton() {
    this.mpBtn.setObjectName("PageButton");
    this.mpBtn.setIcon(this.mainIcon);
    this.mpBtn.setIconSize(new QSize(28, 28));
    this.mpBtn.setFixedSize(48, 48 + 10);
    this.mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    this.mpBtn.setProperty('toolTip', 'Direct Messages');
    this.mpBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'dm'));
    this.hr.setObjectName('Separator');
    this.hr.setFixedSize(33, 9);
  }
  private initContainer() {
    this.layout = new QBoxLayout(Direction.TopToBottom);
    this.container = new QWidget();
    this.takeWidget();
    this.container.setLayout(this.layout);
    this.container.setObjectName(this.constructor.name);
    this.layout.setContentsMargins(12, 12, 12, 12);
    this.layout.setSpacing(0);
    this.setWidget(this.container);
    this.container.layout?.addWidget(this.mpBtn);
    this.container.layout?.addWidget(this.hr);
    this.layout.addStretch(1);
  }
  private loadGuild(guild: Guild, i: number) {
    pictureWorker.loadImage(guild.iconURL({size: 64, format: 'png'}) || '')
      .then(imageBuffer => {
        //console.log(guild.name);
        if (imageBuffer) {
          const guildImage = new QPixmap();
          guildImage.loadFromData(imageBuffer, 'PNG');
          guildElem.setPixmap(guildImage.scaled(48, 48, 1, 1));
        }
      });
    const guildElem = new QLabel(this.container);
    guildElem.setObjectName("PageButton");
    guildElem.setFixedSize(48, 48 + 10);
    guildElem.setCursor(new QCursor(CursorShape.PointingHandCursor));
    guildElem.setProperty('toolTip', guild.name);
    guildElem.setText(guild.nameAcronym);
    guildElem.setAlignment(AlignmentFlag.AlignCenter);
    guildElem.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      app.emit(Events.SWITCH_VIEW, 'guild', { guild });
    });
    this.guilds.set(guild, guildElem);
    this.layout.insertWidget(i + 2, guildElem);
  }
  async loadGuilds() {
    const { client } = app;
    this.initContainer();

    const guilds = client.guilds.cache
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .array();
    if (app.config.fastLaunch) guilds.length = 5;
    guilds.forEach(this.loadGuild.bind(this));
  }
}