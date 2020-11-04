import {
  QAction, QMenu, QPoint, WidgetAttribute, WidgetEventTypes,
} from '@nodegui/nodegui';
import { Guild } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { ViewOptions } from '../../views/ViewOptions';

export class GuildActionsMenu extends QMenu {
  guild?: Guild;

  items = new Map<string, QAction>();

  margin = [8, 10];

  constructor(parent?: any) {
    super(parent);
    this.setObjectName('ActionsMenu');
    this.setInlineStyle('border-radius: 4px');
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.initComponent();
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view !== 'guild' || !options) return;
      if (options.guild) this.guild = options.guild;
      else if (options.channel) this.guild = options.channel.guild;
    });
    this.addEventListener(WidgetEventTypes.Hide, () => this.updateComponent());
  }

  private initComponent() {
    {
      const item = new QAction();
      item.setText(__('CHANGE_NICKNAME'));
      item.addEventListener('triggered', async () => {
        if (!app.client.user) return;
        const member = this.guild?.member(app.client.user);
        if (!member) return;
        app.window.dialogs.nicknameChange.openForMember(member);
      });
      this.addAction(item);
      this.items.set('CHANGE_NICKNAME', item);
    }
    {
      const item = new QAction();
      item.setText(__('HIDE_MUTED_CHANNELS'));
      item.addEventListener('triggered', async () => {
        if (!this.guild) return;
        const settings = { ...app.config.userLocalGuildSettings[this.guild.id] };
        settings.hideMutedChannels = !(settings.hideMutedChannels ?? false);
        app.config.userLocalGuildSettings[this.guild.id] = settings;
        void app.configManager.save();
        this.updateComponent();
      });
      this.addAction(item);
      this.items.set('HIDE_MUTED_CHANNELS', item);
    }

    {
      const item = new QAction();
      item.setText(__('LEAVE_SERVER'));
      item.addEventListener('triggered', () => {
        if (!this.guild) return;
        app.window.dialogs.confirmLeaveGuild.openForGuild(this.guild);
      });
      this.addAction(item);
      this.items.set('LEAVE_SERVER', item);
    }
  }

  private updateComponent() {
    if (!this.guild || !app.client.user) return;
    this.items.get('LEAVE_SERVER')?.setProperty('visible', this.guild.ownerID !== app.client.user?.id);

    const settings = { ...app.config.userLocalGuildSettings[this.guild.id] };
    settings.hideMutedChannels = settings.hideMutedChannels ?? false;
    this.items.get('HIDE_MUTED_CHANNELS')?.setText(__(settings.hideMutedChannels ? 'SHOW_MUTED_CHANNELS' : 'HIDE_MUTED_CHANNELS'));

    const member = this.guild.member(app.client.user);
    if (!member) return;
    this.items.get('CHANGE_NICKNAME')?.setProperty('visible', (
      member.hasPermission('CHANGE_NICKNAME') || member.hasPermission('MANAGE_NICKNAMES')
    ) ?? false);
  }

  setMinimumSize(width: number, height: number) {
    super.setMinimumSize(width - this.margin[1] * 2, height - this.margin[0] * 2);
  }

  popup(point: QPoint) {
    const p = new QPoint(point.x() + this.margin[1], point.y() + this.margin[0]);
    super.popup(p);
    this.updateComponent();
  }
}
