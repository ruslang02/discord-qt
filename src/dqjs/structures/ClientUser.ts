import { ClientUser, Structures, Invite, Guild, Constants } from 'discord.js';
import { DQClient } from '../client/Client';
import { DQClientUserSettings } from './ClientUserSettings';
import { CustomStatus } from './CustomStatus';

export class DQClientUser extends ClientUser {
  /**
   * Various settings for this user
   * <warn>This is only filled when using a user account.</warn>
   * @type {?ClientUserSettings}
   */
  settings: DQClientUserSettings | null;
  /**
   * The email of this account
   * <warn>This is only filled when using a user account.</warn>
   * @type {?string}
   */
  email: string | null = null;
  /**
   * If the user has Discord premium (nitro)
   * <warn>This is only filled when using a user account.</warn>
   * @type {?boolean}
   */
  premium: boolean | null = null;

  constructor(client: DQClient, data: any) {
    // @ts-ignore
    super(client, data.user);
    console.log(data.user);
    this.settings = data.user_settings ? new DQClientUserSettings(this, data.user_settings) : null;
  }

  _patch(data: any) {
    // @ts-ignore
    super._patch(data);
    if ('email' in data) {
      this.email = typeof data.email === 'string' ? data.email : null;
    }
    if ('premium' in data) {
      this.premium = typeof data.premium === 'boolean' ? data.premium : null;
    }
    console.log(this.email);
  }
  /**
   * ClientUser's custom status
   * @type {CustomStatus}
   * @readonly
   */
  get customStatus() {
    return this.settings?.customStatus;
  }

  /**
   * Sets the custom status of the client user.
   * @param {CustomStatus} data Data for the presence
   * @returns {Promise<Object>}
   * @example
   * // Set the client user's custom status
   * client.user.setCustomStatus({ text: "Happy", emoji_name: "😀" })
   *   .then(console.log)
   *   .catch(console.error);
   */
  async setCustomStatus(data: CustomStatus) {
    if (!this.settings) return;
    // @ts-ignore
    await this.client.presence.set({
      activities: [
        {
          type: 4,
          state: data.text || null,
          name: 'Custom Status',
          emoji: {
            id: data.emoji_id || null,
            name: data.emoji_name || null,
            animated: false,
          },
        },
      ],
    });
    const newSettings = await this.settings.update('custom_status', data);
    this.settings._patch(newSettings);
    return newSettings;
  }

  /**
   * Accepts an invite to join a guild.
   * <warn>This is only available when using a user account.</warn>
   * @param {Invite|string} code Invite or code to accept
   * @returns {Promise<Guild>} Joined guild
   */
  acceptInvite(code: Invite | string) {
    // @ts-ignore
    if (code.id) code = code.id;
    return new Promise((resolve, reject) =>
    // @ts-ignore
      (this.client.api as any)
        .invite(code)
        .post()
        .then((res: { id: string}) => {
          const handler = (guild: Guild) => {
            if (guild.id === res.id) {
              resolve(guild);
              this.client.removeListener(Constants.Events.GUILD_CREATE, handler);
            }
          };
          this.client.on(Constants.Events.GUILD_CREATE, handler);
          this.client.setTimeout(() => {
            this.client.removeListener(Constants.Events.GUILD_CREATE, handler);
            reject(new Error('Accepting invite timed out'));
          }, 120e3);
        })
        .catch(() => reject(new Error('Invite code is not valid'))),
    );
  }
}