import { User } from 'discord.js';

const GuildChannel = require('discord.js/src/structures/GuildChannel');

GuildChannel.prototype.can = function (flags: number, who?: User) {
  if (!who) who = this.client.user;
  return this.permissionsFor(who)?.has(flags) ?? false;
}