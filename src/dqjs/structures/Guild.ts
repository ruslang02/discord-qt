import { Guild } from 'discord.js';
import { DQClient } from '../client/Client';

export class DQGuild extends Guild {
  //@ts-ignore
  client: DQClient;
  
  constructor(
    client: DQClient,
    data: any
  ) {
    // @ts-ignore
    super(client, data);
  }
  /**
    * The position of this guild
    * <warn>This is only available when using a user account.</warn>
    * @type {?number}
    * @readonly
    */
  get position() {
    if (this.client.user?.bot) return null;
    if (!this.client.user?.settings?.guildPositions) return null;
    return this.client.user.settings.guildPositions.indexOf(this.id);
  }
}