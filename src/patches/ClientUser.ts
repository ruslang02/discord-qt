import { Invite, Client, Collection, Constants, Guild } from 'discord.js';
import { CustomStatus } from '../utilities/CustomStatus';
import { patchAfter, patchClass } from '../utilities/Patcher';
import { ClientUserSettings } from './ClientUserSettings';

const ClientUser = require('discord.js/src/structures/ClientUser');

const proto = ClientUser.prototype;

class ClientUserPatch {
  client?: Client;

  email?: string;

  guildSettings = new Collection();

  notes = new Collection();

  premium?: boolean;

  settings?: ClientUserSettings;

  get customStatus() {
    return this.settings?.customStatus;
  }

  _patch = patchAfter(proto._patch, function afterPatch(_, data: any) {
    if ('email' in data && typeof data.email === 'string') {
      this.email = data.email;
    }

    if ('premium' in data && typeof data.premium === 'boolean') {
      this.premium = data.premium;
    }
  });

  async setCustomStatus(data?: CustomStatus) {
    if (!this.settings) {
      return null;
    }

    let fixed = data
      ? {
          emoji_id:
            typeof data.emoji_id === 'string' && data.emoji_id.length ? data.emoji_id : null,
          emoji_name:
            typeof data.emoji_name === 'string' && data.emoji_name.length ? data.emoji_name : null,
          text: typeof data.text === 'string' && data.text.trim().length ? data.text.trim() : null,
          expires_at: data.expires_at,
        }
      : null;

    if (!fixed?.emoji_id && !fixed?.emoji_name && !fixed?.text) {
      fixed = null;
    }

    await this.client?.presence.set({
      customStatus: fixed
        ? {
            type: 4,
            state: fixed.text,
            name: 'Custom Status',
            emoji:
              fixed.emoji_id || fixed.emoji_name
                ? {
                    id: fixed.emoji_id,
                    name: fixed.emoji_name,
                    animated: false,
                  }
                : null,
          }
        : undefined,
    });

    const newSettings = await this.settings.update('custom_status', fixed);

    this.settings._patch(newSettings);

    return newSettings;
  }

  async acceptInvite(code: Invite | string): Promise<Guild> {
    const codeId = typeof code === 'string' ? code : code.code;

    return new Promise((resolve, reject) =>
      (this.client as any).api
        .invite(codeId)
        .post()
        .then((res: { id: string }) => {
          const handler = (guild: any) => {
            if (guild.id === res.id) {
              resolve(guild);
              this.client?.removeListener(Constants.Events.GUILD_CREATE, handler);
            }
          };

          this.client?.on(Constants.Events.GUILD_CREATE, handler);
          this.client?.setTimeout(() => {
            this.client?.removeListener(Constants.Events.GUILD_CREATE, handler);
            reject(new Error('Accepting invite timed out'));
          }, 120_000);
        })
        .catch(() => {
          reject(new Error('Invite code is not valid'));
        })
    );
  }
}

patchClass(proto, ClientUserPatch);
