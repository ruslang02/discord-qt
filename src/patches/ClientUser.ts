import { Collection, Constants } from 'discord.js';
import { CustomStatus } from '../utilities/CustomStatus';

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
Object.defineProperty(ClientUser.prototype, 'guildSettings', {
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
ClientUser.prototype.setCustomStatus = async function setCustomStatus(data?: CustomStatus) {
  if (!this.settings) return null;
  let fixed = data ? {
    emoji_id: typeof data.emoji_id == 'string' && data.emoji_id.length ? data.emoji_id : null,
    emoji_name: typeof data.emoji_name == 'string' && data.emoji_name.length ? data.emoji_name : null,
    text: typeof data.text == 'string' && data.text.trim().length ? data.text.trim() : null,
    expires_at: data.expires_at,
  } : null;
  if (!fixed?.emoji_id && !fixed?.emoji_name && !fixed?.text) fixed = null;
  await this.client.presence.set({
    customStatus: fixed ? {
      type: 4,
      state: fixed.text,
      name: 'Custom Status',
      emoji: (fixed.emoji_id || fixed.emoji_name) ? {
        id: fixed.emoji_id,
        name: fixed.emoji_name,
        animated: false,
      } : null,
    } : undefined,
  });
  const newSettings = await this.settings.update('custom_status', fixed);
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