import { Collection, Constants, Client } from 'discord.js';

const ClientPresence = require('discord.js/src/structures/ClientPresence');
const { ActivityTypes } = Constants;

export class DQClientPresence extends ClientPresence {

  constructor(client: Client) {
    super(client);
  }

  async _parse({ status, since, afk, activity, activities }: any) {
    const applicationID = activity && (activity.application ? activity.application.id || activity.application : null);
    let assets = new Collection();
    if (activity) {
      if (typeof activity.name !== 'string') throw new TypeError('INVALID_TYPE');
      if (!activity.type) activity.type = 0;
      if (activity.assets && applicationID) {
        try {
          const a = await this.client.api.oauth2.applications(applicationID).assets.get();
          for (const asset of a) assets.set(asset.name, asset.id);
        } catch {} // eslint-disable-line no-empty
      }
    }

    const packet: any = {
      afk: afk != null ? afk : false, // eslint-disable-line eqeqeq
      since: since != null ? since : null, // eslint-disable-line eqeqeq
      status: status || this.status,
    };
    if (activities) packet.activities = activities;
    packet.game = activity
      ? {
          type: activity.type,
          name: activity.name,
          url: activity.url,
          details: activity.details || undefined,
          state: activity.state || undefined,
          assets: activity.assets
            ? {
                large_text: activity.assets.largeText || undefined,
                small_text: activity.assets.smallText || undefined,
                large_image: assets.get(activity.assets.largeImage) || activity.assets.largeImage,
                small_image: assets.get(activity.assets.smallImage) || activity.assets.smallImage,
              }
            : undefined,
          timestamps: activity.timestamps || undefined,
          party: activity.party || undefined,
          application_id: applicationID || undefined,
          secrets: activity.secrets || undefined,
          instance: activity.instance || undefined,
        }
      : null;

    if ((status || afk || since) && !activity) {
      packet.game = this.activities[0] || null;
    }

    if (packet.game) {
      packet.game.type =
        typeof packet.game.type === 'number' ? packet.game.type : ActivityTypes.indexOf(packet.game.type);
    }
    return packet;
  }
}