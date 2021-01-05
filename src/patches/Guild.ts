/* eslint-disable class-methods-use-this */
import { ChannelManager, Snowflake, Client, Permissions } from 'discord.js';
import { patchClass } from '../utilities/Patcher';
import { ClientUserGuildSettings } from './ClientUserGuildSettings';

const Guild = require('discord.js/src/structures/Guild');

const proto = Guild.prototype;

class GuildPatch {
  channels?: ChannelManager;

  client?: Client;

  id?: Snowflake;

  get shardID() {
    return 0;
  }

  set shardID(_value) {
    /**/
  }

  /**
   * Get a guild setting
   * @param setting Name of the setting to get
   * @return Null if there's an error
   */
  private getGuildSetting<T extends keyof ClientUserGuildSettings>(
    setting: T
  ): ClientUserGuildSettings[T] | null {
    if (!this.client?.user || this.client.user.bot || !this.id) {
      return null;
    }

    try {
      const guildSettings = this.client.user.guildSettings.get(this.id);

      if (!guildSettings) {
        return null;
      }

      return guildSettings[setting];
    } catch (err) {
      return null;
    }
  }

  get acknowledged() {
    return this.channels?.cache
      .filter((channel: any) => {
        if (['text', 'news'].includes(channel.type)) {
          return channel.can(Permissions.FLAGS.VIEW_CHANNEL) && !channel.muted;
        }

        return false;
      })
      .every((channel: any) => channel.acknowledged);
  }

  get position() {
    if (!this.client?.user || this.client.user.bot || !this.id) {
      return null;
    }

    if (!this.client.user.settings?.guildPositions) {
      return null;
    }

    return this.client.user.settings.guildPositions.indexOf(this.id);
  }

  get muted() {
    return this.getGuildSetting('muted');
  }

  get messageNotifications() {
    return this.getGuildSetting('messageNotifications');
  }

  get mobilePush() {
    return this.getGuildSetting('mobilePush');
  }

  get suppressEveryone() {
    return this.getGuildSetting('suppressEveryone');
  }

  subscribeToTypingEvent() {
    void this.client?.shard?.send({
      op: 14,
      d: { guild_id: this.id, typing: true, activities: true },
    });
  }
}

patchClass(proto, GuildPatch);
