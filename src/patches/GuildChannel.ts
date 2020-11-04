import { Constants, DQConstants, User } from 'discord.js';

const GuildChannel = require('discord.js/src/structures/GuildChannel');

GuildChannel.prototype.can = function (flags: number, who?: User) {
  if (!who) who = this.client.user;
  return this.permissionsFor(who)?.has(flags) ?? false;
}

Object.defineProperty(GuildChannel.prototype, 'muted', {
  get: function () {
    if (this.client.user.bot) return null;
    try {
      return this.client.user.guildSettings.get(this.guild.id).channelOverrides.get(this.id).muted;
    } catch (err) {
      return false;
    }
  }
});

Object.defineProperty(GuildChannel.prototype, 'messageNotifications', {
  get: function () {
    if (this.client.user.bot) return null;
    try {
      return this.client.user.guildSettings.get(this.guild.id).channelOverrides.get(this.id).messageNotifications;
    } catch (err) {
      return (Constants as unknown as DQConstants).MessageNotificationTypes[3];
    }
  }
});