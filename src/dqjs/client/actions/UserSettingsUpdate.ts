const Action = require('discord.js/src/client/actions/Action');

export class UserSettingsUpdateAction extends Action {
  handle(settings: any) {
    const client = this.client;
    /**
     * Emitted whenever a user's details (e.g. username) are changed.
     * @event Client#userSettingsUpdate
     * @param {ClientUserSettings} oldUser The user before the update
     */
    client.emit('userSettingsUpdate', settings);
    return { settings };
  }
}