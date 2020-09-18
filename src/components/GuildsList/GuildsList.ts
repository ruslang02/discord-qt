import { CursorShape, ItemFlag, QCursor, QIcon, QListWidget, QListWidgetItem, QPoint, QPushButton, QSize, QWidget, Shape, WidgetEventTypes } from "@nodegui/nodegui";
import { Client, Constants, Guild, DQConstants } from "discord.js";
import { __ } from "i18n";
import path from "path";
import { app, MAX_QSIZE } from "../..";
import { Events as AppEvents } from "../../structures/Events";
import { ViewOptions } from '../../views/ViewOptions';
import { GuildButton } from './GuildButton';

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

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants as unknown as DQConstants;
      client.on(Events.CLIENT_READY, async () => {
        await this.loadGuilds();
        app.emit(AppEvents.SWITCH_VIEW, 'dm');
      });
      client.on(Events.GUILD_DELETE, guild => {
        this.guilds.get(guild)?.hide();
      });
      client.on(Events.GUILD_CREATE, guild => {
        const btn = new GuildButton(guild, this);
        const item = new QListWidgetItem();
        item.setFlags(~ItemFlag.ItemIsEnabled);
        this.insertItem(2, item);
        this.setItemWidget(item, btn);
        this.guilds.set(guild, btn);
        this.updateGuildAck(guild)
        btn.loadAvatar();
      });
      client.on(Events.MESSAGE_ACK, channel => this.updateGuildAck(channel.guild))
    });

    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) return;
      this.mpBtn.setProperty('active', false)
      if (view === 'dm') {
        this.active?.setProperty('active', false);
        this.active?.repolish();
        this.mpBtn.setProperty('active', true);
        this.active = this.mpBtn;
        this.active.repolish();
      } else if (view === 'guild' && options) {
        const guild = options.guild || options.channel?.guild;
        if (!guild) return;
        this.active?.setProperty('active', false);
        this.active?.repolish();
        const active = this.guilds.get(guild);
        active?.setProperty('active', true);
        this.active = active;
        this.active?.repolish();
      }
    });
  }

  private updateGuildAck(guild: Guild) {
    const btn = this.guilds.get(guild);
    if (!btn) return;
    btn.setProperty('unread', !guild.acknowledged);
    btn.repolish();
  }

  private addMainPageButton() {
    const mpBtn = new QPushButton(this);
    const mpBtnItem = new QListWidgetItem();
    mpBtn.setObjectName("PageButton");
    mpBtn.setIcon(this.mainIcon);
    mpBtn.setIconSize(new QSize(28, 28));
    mpBtn.setFixedSize(72, 68);
    mpBtn.setCursor(new QCursor(CursorShape.PointingHandCursor));
    mpBtn.setProperty('toolTip', __('DIRECT_MESSAGES'));
    mpBtn.addEventListener('clicked', () => app.emit(AppEvents.SWITCH_VIEW, 'dm'));
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
    this.mpBtn = mpBtn;
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