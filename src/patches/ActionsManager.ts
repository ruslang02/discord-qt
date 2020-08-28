import { Constants } from 'discord.js';

const Action = require('discord.js/src/client/actions/Action');
const ActionsManager = require('discord.js/src/client/actions/ActionsManager');
const { Events } = Constants;

export class UserSettingsUpdateAction extends Action {
  handle(settings: any) {
    const client = this.client;
    /**
     * Emitted whenever a user's details (e.g. username) are changed.
     * @event Client#userSettingsUpdate
     * @param {ClientUserSettings} oldUser The user before the update
     */
    client.emit(Events.USER_SETTINGS_UPDATE, settings);
    return { settings };
  }
}
Object.defineProperty(ActionsManager.prototype, '_imported', {
  value: false,
  writable: true,
});
const _superRegister = ActionsManager.prototype.register;
ActionsManager.prototype.register = function register(action: any) {
  _superRegister.apply(this, arguments);
  if (!this._imported) {
    // @ts-ignore
    this.UserSettingsUpdate = new UserSettingsUpdateAction(this.client);
    this._imported = true;
  }
}