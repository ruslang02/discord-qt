import {
  Client,
  Collection,
  Constants,
  DQConstants,
  MessageNotificationType,
  Snowflake,
} from 'discord.js';
import { ClientUserChannelOverride } from './ClientUserChannelOverride';

/**
 * A wrapper around the ClientUser's guild settings.
 */
export class ClientUserGuildSettings {
  guildID: Snowflake;

  channelOverrides: Collection<Snowflake, ClientUserChannelOverride>;

  acknowledged?: boolean;

  position?: number;

  muted?: boolean;

  messageNotifications?: MessageNotificationType;

  mobilePush?: boolean;

  suppressEveryone?: boolean;

  constructor(data: any, public client: Client) {
    this.guildID = data.guild_id;
    this.channelOverrides = new Collection();
    this.patch(data);
  }

  patch(data: any) {
    const { UserGuildSettingsMap } = Constants as DQConstants;

    for (const [key, value] of Object.entries(UserGuildSettingsMap)) {
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
    return (this.client as any).rest.methods.patchClientUserGuildSettings(this.guildID, {
      [name]: value,
    });
  }
}
