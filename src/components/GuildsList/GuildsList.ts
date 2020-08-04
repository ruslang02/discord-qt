import { QWidget, QIcon, QSize, QPushButton, QCursor, CursorShape, Shape, WidgetEventTypes, QPoint, QListWidget, QListWidgetItem, ItemFlag } from "@nodegui/nodegui";
import path from "path";
import { Guild, Client, Constants } from "discord.js";
import { app, MAX_QSIZE } from "../..";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { GuildButton } from './GuildButton';
import './GuildsList.scss';

export class GuildsList extends QListWidget {
  private mpBtn = new QPushButton();
  private mainIcon = new QIcon(path.resolve(__dirname, "./assets/icons/home.png"));
  private guilds = new Map<Guild, GuildButton>();
  private active?: QPushButton | GuildButton;

  constructor() {
    super();

    this.setFrameShape(Shape.NoFrame);
    this.setMaximumSize(72, MAX_QSIZE);
    this.setObjectName('GuildsList');
    this.addEventListener(WidgetEventTypes.Paint, this.loadAvatars.bind(this));

    app.on(Events.NEW_CLIENT, (client: Client) => {
      const { Events: DEvents } = Constants;
      client.on(DEvents.CLIENT_READY, this.loadGuilds.bind(this));
      client.on(DEvents.GUILD_DELETE, (guild: Guild) => {
        const entry = this.guilds.get(guild);
        if (!entry) return;
        entry.hide();
      });
      client.on(DEvents.GUILD_CREATE, (guild: Guild) => {
        const btn = new GuildButton(guild, this);
        const item = new QListWidgetItem();
        item.setFlags(~ItemFlag.ItemIsEnabled);
        this.insertItem(2, item);
        this.setItemWidget(item, btn);
        this.guilds.set(guild, btn);
        btn.loadAvatar();
      });
    });

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
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
    });
  }

  private addMainPageButton() {
    const mpBtn = new QPushButton(this);
    const mpBtnItem = new QListWidgetItem();
    mpBtn.setObjectName("PageButton");
    mpBtn.setIcon(this.mainIcon);
    mpBtn.setIconSize(new QSize(28, 28));
    mpBtn.setFixedSize(72, 68);
    mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    mpBtn.setProperty('toolTip', 'Direct Messages');
    mpBtn.addEventListener('clicked', () => app.emit(Events.SWITCH_VIEW, 'dm'));
    mpBtn.setInlineStyle('margin-top: 12px;');
    mpBtnItem.setSizeHint(mpBtn.size());
    const hrItem = new QListWidgetItem();
    const hr = new QWidget(this);
    hr.setObjectName('Separator');
    hr.setMaximumSize(MAX_QSIZE, 10);
    hrItem.setSizeHint(new QSize(1, 10));
    [mpBtnItem, hrItem].forEach(i => i.setFlags(~ItemFlag.ItemIsEnabled));
    this.addItem(mpBtnItem);
    this.addItem(hrItem);
    this.setItemWidget(mpBtnItem, mpBtn);
    this.setItemWidget(hrItem, hr);
  }
  async loadGuilds() {
    const { client } = app;

    this.guilds.clear();
    this.clear();
    this.addMainPageButton();

    client.guilds.cache
      .array()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .forEach((guild, i) => {
        const btn = new GuildButton(guild, this);
        const item = new QListWidgetItem();
        item.setFlags(~ItemFlag.ItemIsEnabled);
        item.setSizeHint(btn.size());
        this.addItem(item);
        this.setItemWidget(item, btn);
        this.guilds.set(guild, btn);
      });
    this.loadAvatars();
  }
  private p0 = new QPoint(0, 0);
  private ratelimited = false;
  private ratetimer?: NodeJS.Timer;
  async loadAvatars() {
    if (this.ratelimited) return;
    this.ratelimited = true;
    if (this.ratetimer) clearTimeout(this.ratetimer);
    this.ratetimer = setTimeout(() => this.ratelimited = false, 100);
    const height = app.window.size().height();
    for (const btn of this.guilds.values()) {
      if (!btn.loadAvatar || btn.hasPixmap) continue;
      const iy = btn.mapToParent(this.p0).y();
      if (iy > 0 && iy < height) btn.loadAvatar();
    }
  }
}