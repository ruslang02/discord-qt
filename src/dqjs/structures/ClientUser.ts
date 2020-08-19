import { ClientUser } from 'discord.js';
import { DQClient } from '../client/Client';
import { DQClientUserSettings } from './ClientUserSettings';

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
}