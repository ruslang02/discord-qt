import { Constants, DQConstants, User } from 'discord.js';

const GuildChannel = require('discord.js/src/structures/GuildChannel');

GuildChannel.prototype.can = function can(flags: number, _who?: User) {
  const who = !_who ? this.client.user : _who;

  return this.permissionsFor(who)?.has(flags) ?? false;
};

Object.defineProperty(GuildChannel.prototype, 'muted', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      return this.client.user.guildSettings.get(this.guild.id).channelOverrides.get(this.id).muted;
    } catch (err) {
      return false;
    }
  },
});

Object.defineProperty(GuildChannel.prototype, 'messageNotifications', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      const guildSettings = this.client.user.guildSettings.get(this.guild.id);
      return guildSettings.channelOverrides.get(this.id).messageNotifications;
    } catch (err) {
      return ((Constants as unknown) as DQConstants).MessageNotificationTypes[3];
    }
  },
});
