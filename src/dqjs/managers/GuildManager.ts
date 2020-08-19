'use strict';

import { Snowflake, Constants, BaseManager, GuildChannel, GuildMember, Util, GuildEmoji, Role, Invite, DataResolver, SnowflakeUtil, GuildResolvable, Collection } from 'discord.js';
import { DQGuild } from '../structures/Guild';
import { DQClient } from '../client/Client';
const {
  Events,
  VerificationLevels,
  DefaultMessageNotifications,
  ExplicitContentFilterLevels,
} = Constants;

/**
 * Manages API methods for Guilds and stores their cache.
 * @extends {BaseManager}
 */
export class DQGuildManager extends BaseManager<Snowflake, DQGuild, GuildResolvable> {
  // @ts-ignore
  client: DQClient;
  constructor(client: DQClient, iterable?: any) {
    // @ts-ignore
    super(client, iterable, DQGuild, Collection);
  }

  resolve(guild: GuildResolvable) {
    if (
      guild instanceof GuildChannel ||
      guild instanceof GuildMember ||
      guild instanceof GuildEmoji ||
      guild instanceof Role ||
      (guild instanceof Invite && guild.guild)
    ) {
      if (!guild.guild) return null;
      return super.resolve(guild.guild);
    }
    return super.resolve(guild);
  }

  /**
   * Resolves a GuildResolvable to a Guild ID string.
   * @method resolveID
   * @memberof GuildManager
   * @instance
   * @param {GuildResolvable} guild The guild resolvable to identify
   * @returns {?Snowflake}
   */
  resolveID(guild: GuildResolvable) {
    if (
      guild instanceof GuildChannel ||
      guild instanceof GuildMember ||
      guild instanceof GuildEmoji ||
      guild instanceof Role ||
      (guild instanceof Invite && guild.guild)
    ) {
      if (!guild.guild) return null;
      return super.resolveID(guild.guild.id);
    }
    return super.resolveID(guild);
  }

  /**
   * Creates a guild.
   * <warn>This is only available to bots in fewer than 10 guilds.</warn>
   * @param {string} name The name of the guild
   * @param {Object} [options] Options for the creating
   * @param {PartialChannelData[]} [options.channels] The channels for this guild
   * @param {DefaultMessageNotifications} [options.defaultMessageNotifications] The default message notifications
   * for the guild
   * @param {ExplicitContentFilterLevel} [options.explicitContentFilter] The explicit content filter level for the guild
   * @param {BufferResolvable|Base64Resolvable} [options.icon=null] The icon for the guild
   * @param {string} [options.region] The region for the server, defaults to the closest one available
   * @param {PartialRoleData[]} [options.roles] The roles for this guild,
   * the first element of this array is used to change properties of the guild's everyone role.
   * @param {VerificationLevel} [options.verificationLevel] The verification level for the guild
   * @returns {Promise<Guild>} The guild that was created
   */
  async create(
    name: string,
    {
      channels = [],
      defaultMessageNotifications,
      explicitContentFilter,
      icon = null,
      region,
      roles = [],
      verificationLevel,
    }: any,
  ): Promise<DQGuild> {
    icon = await DataResolver.resolveImage(icon);
    if (typeof verificationLevel !== 'undefined' && typeof verificationLevel !== 'number') {
      verificationLevel = VerificationLevels.indexOf(verificationLevel);
    }
    if (typeof defaultMessageNotifications !== 'undefined' && typeof defaultMessageNotifications !== 'number') {
      defaultMessageNotifications = DefaultMessageNotifications.indexOf(defaultMessageNotifications);
    }
    if (typeof explicitContentFilter !== 'undefined' && typeof explicitContentFilter !== 'number') {
      explicitContentFilter = ExplicitContentFilterLevels.indexOf(explicitContentFilter);
    }
    for (const channel of channels) {
      channel.parent_id = channel.parentID;
      delete channel.parentID;
      if (!channel.permissionOverwrites) continue;
      for (const overwrite of channel.permissionOverwrites) {
        // @ts-ignore
        if (overwrite.allow) overwrite.allow = Permissions.resolve(overwrite.allow);
        // @ts-ignore
        if (overwrite.deny) overwrite.deny = Permissions.resolve(overwrite.deny);
      }
      channel.permission_overwrites = channel.permissionOverwrites;
      delete channel.permissionOverwrites;
    }
    for (const role of roles) {
      if (role.color) role.color = Util.resolveColor(role.color);
      // @ts-ignore
      if (role.permissions) role.permissions = Permissions.resolve(role.permissions);
    }
    return new Promise((resolve, reject) =>
    // @ts-ignore
      this.client.api.guilds
        .post({
          data: {
            name,
            region,
            icon,
            verification_level: verificationLevel,
            default_message_notifications: defaultMessageNotifications,
            explicit_content_filter: explicitContentFilter,
            channels,
            roles,
          },
        })
        .then((data: any) => {
          if (this.client.guilds.cache.has(data.id)) return resolve(this.client.guilds.cache.get(data.id));

          const handleGuild = (guild: DQGuild) => {
            if (guild.id === data.id) {
              this.client.clearTimeout(timeout);
              this.client.removeListener(Events.GUILD_CREATE, handleGuild);
              // @ts-ignore
              this.client.decrementMaxListeners();
              resolve(guild);
            }
          };
          // @ts-ignore
          this.client.incrementMaxListeners();
          // @ts-ignore
          this.client.on(Events.GUILD_CREATE, handleGuild);

          const timeout = this.client.setTimeout(() => {
            this.client.removeListener(Events.GUILD_CREATE, handleGuild);
            // @ts-ignore
            this.client.decrementMaxListeners();
            resolve(this.client.guilds.add(data));
          }, 10000);
          return undefined;
        }, reject),
    );
  }

  async fetch(id: Snowflake, cache = true, force = false) {
    if (!force) {
      const existing = this.cache.get(id);
      if (existing) return existing;
    }

    // @ts-ignore
    const data = await this.client.api.guilds(id).get({ query: { with_counts: true } });
    console.log(data);
    return this.add(data, cache);
  }
}
