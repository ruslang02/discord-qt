/* eslint-disable max-classes-per-file */
import { Client, Constants, DQConstants, TextChannel } from 'discord.js';

const Action = require('discord.js/src/client/actions/Action');
const ActionsManager = require('discord.js/src/client/actions/ActionsManager');

const { Events } = (Constants as unknown) as DQConstants;

class MessageAcknowledgedAction extends Action {
  handle(data: any): any {
    const client = this.client as Client;
    const channel = client.channels.resolve(data.channel_id) as TextChannel;
    const state = client.read_state.find((s: any) => s.id === data.channel_id);
    const message = channel.messages.resolve(data.message_id);

    if (!state || !channel || !message) {
      return undefined;
    }

    state.last_message_id = data.message_id;
    /**
     * Emitted whenever a channel/messages change their read state
     * @event Client#messageAck
     * @param {GuildChannel} channel Channel where the read state changed
     * @param {Message} message The most recent message read
     */
    client.emit(Events.MESSAGE_ACK, channel, message);

    return data;
  }
}

class UserNoteUpdateAction extends Action {
  handle(data: any) {
    const { client } = this;

    const oldNote = client.user.notes.get(data.id);
    const note = data.note.length ? data.note : null;

    client.user.notes.set(data.id, note);

    client.emit(Events.USER_NOTE_UPDATE, data.id, oldNote, note);

    return {
      old: oldNote,
      updated: note,
    };
  }
}

class UserSettingsUpdateAction extends Action {
  handle(settings: any) {
    const { client } = this;

    if ('status' in settings) {
      client.presence.status = settings.status;
    }

    /**
     * Emitted whenever a user's details (e.g. username) are changed.
     * @event Client#userSettingsUpdate
     * @param {ClientUserSettings} settings New user settings
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

ActionsManager.prototype.register = function register(...args: any[]) {
  _superRegister.apply(this, args);

  if (!this._imported) {
    // @ts-ignore
    this.MessageAcknowledged = new MessageAcknowledgedAction(this.client);
    // @ts-ignore
    this.UserNoteUpdate = new UserNoteUpdateAction(this.client);
    // @ts-ignore
    this.UserSettingsUpdate = new UserSettingsUpdateAction(this.client);
    this._imported = true;
  }
};
