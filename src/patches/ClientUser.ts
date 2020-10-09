import { Collection, Constants } from 'discord.js';
import { CustomStatus } from '../structures/CustomStatus';

const ClientUser = require('discord.js/src/structures/ClientUser');
Object.defineProperty(ClientUser.prototype, 'email', {
  value: null,
  writable: true,
});
Object.defineProperty(ClientUser.prototype, 'premium', {
  value: null,
  writable: true,
});
Object.defineProperty(ClientUser.prototype, 'settings', {
  value: null,
  writable: true,
});
Object.defineProperty(ClientUser.prototype, 'notes', {
  value: new Collection(),
  writable: true
});
const _patch = ClientUser.prototype._patch;
ClientUser.prototype._patch = function _newPatch(data: any) {
  _patch.apply(this, arguments);
  if ('email' in data) {
    this.email = typeof data.email === 'string' ? data.email : null;
  }
  if ('premium' in data) {
    this.premium = typeof data.premium === 'boolean' ? data.premium : null;
  }
}
Object.defineProperty(ClientUser.prototype, 'customStatus', {
  get: function getCustomStatus() {
    return this.settings.customStatus;
  }
});
ClientUser.prototype.setCustomStatus = async function setCustomStatus(data: CustomStatus) {
  if (!this.settings) return null;
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
ClientUser.prototype.acceptInvite = async function acceptInvite(code: { id: string } | string) {
  if (typeof code !== 'string') code = code.id;
  return new Promise((resolve, reject) =>
    (this.client.api as any)
      .invite(code)
      .post()
      .then((res: { id: string }) => {
        const handler = (guild: any) => {
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
      .catch((e: Error) => {
        console.error(e);
        reject(new Error('Invite code is not valid'));
      }),
  );
}