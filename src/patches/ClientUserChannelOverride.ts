import { Constants, DQConstants, MessageNotificationType } from 'discord.js';

/**
 * A wrapper around the ClientUser's channel overrides.
 */
export class ClientUserChannelOverride {
  muted?: boolean;

  messageNotifications?: MessageNotificationType;

  constructor(data: any) {
    this.patch(data);
  }

  patch(data: any) {
    for (const [key, value] of Object.entries((Constants as DQConstants).UserChannelOverrideMap)) {
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
