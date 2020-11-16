import { Constants, DQConstants } from 'discord.js';

/**
 * A wrapper around the ClientUser's channel overrides.
 */
export class ClientUserChannelOverride {
  constructor(data: any) {
    this.patch(data);
  }

  patch(data: any) {
    for (const key of Object.keys(((Constants as unknown) as DQConstants).UserChannelOverrideMap)) {
      const value = ((Constants as unknown) as DQConstants).UserChannelOverrideMap[key];

      if (data.hasOwnProperty.call(key)) {
        if (typeof value === 'function') {
          // @ts-ignore
          this[value.name] = value(data[key]);
        } else {
          // @ts-ignore
          this[value] = data[key];
        }
      }
    }
  }
}
