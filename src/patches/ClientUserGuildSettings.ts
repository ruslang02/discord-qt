import { Client, Collection, Constants, Snowflake, DQConstants } from 'discord.js';
import { ClientUserChannelOverride } from './ClientUserChannelOverride';

/**
 * A wrapper around the ClientUser's guild settings.
 */
export class ClientUserGuildSettings {
  guildID: Snowflake;

  channelOverrides: Collection<Snowflake, ClientUserChannelOverride>;

  constructor(data: any, public client: Client) {
    this.guildID = data.guild_id;
    this.channelOverrides = new Collection();
    this.patch(data);
  }

  patch(data: any) {
    for (const key of Object.keys(((Constants as unknown) as DQConstants).UserGuildSettingsMap)) {
      const value = ((Constants as unknown) as DQConstants).UserGuildSettingsMap[key];

      if (data.hasOwnProperty.call(key)) {
        if (key === 'channel_overrides') {
          for (const channel of data[key]) {
            this.channelOverrides.set(channel.channel_id, new ClientUserChannelOverride(channel));
          }
        } else if (typeof value === 'function') {
          // @ts-ignore
          this[value.name] = value(data[key]);
        } else {
          // @ts-ignore
          this[value] = data[key];
        }
      }
    }
  }

  update(name: string, value: any) {
    // @ts-ignore
    return this.client.rest.methods.patchClientUserGuildSettings(this.guildID, { [name]: value });
  }
}
