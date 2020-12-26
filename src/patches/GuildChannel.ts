import { Client, Constants, DQConstants, Guild, Snowflake, User } from 'discord.js';
import { patchClass } from '../utilities/Patcher';

const GuildChannel = require('discord.js/src/structures/GuildChannel');

const proto = GuildChannel.prototype;

class GuildChannelPatch {
  client?: Client;

  guild?: Guild;

  id: Snowflake = '0';

  get messageNotifications() {
    if (!this.guild || !this.client?.user || this.client.user.bot) {
      return null;
    }

    try {
      return this.client.user.guildSettings.get(this.guild.id)?.channelOverrides.get(this.id)
        ?.messageNotifications;
    } catch (err) {
      return (Constants as DQConstants).MessageNotificationTypes.INHERIT;
    }
  }

  get muted() {
    if (!this.guild || !this.client?.user || this.client.user.bot) {
      return null;
    }

    try {
      return this.client.user.guildSettings.get(this.guild.id)?.channelOverrides.get(this.id)
        ?.muted;
    } catch (err) {
      return false;
    }
  }

  can(this: typeof GuildChannel, flags: number, _who?: User) {
    const who = _who || this.client?.user;

    return this.permissionsFor(who)?.has(flags) ?? false;
  }
}

patchClass(proto, GuildChannelPatch);
