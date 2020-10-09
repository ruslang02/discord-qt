import { WebSocketShard } from 'discord.js';
import { ClientUserSettings } from '../structures/ClientUserSettings';

const handlers = require('discord.js/src/client/websocket/handlers/index');
const READY = require('discord.js/src/client/websocket/handlers/READY');

Object.assign(handlers, {
  MESSAGE_ACK: function MessageAcknowledgedHandler(client: any, packet: any) {
    client.actions.MessageAcknowledged.handle(packet.d);
  },
  READY: function ReadyHandler(client: any, packet: any, shard: WebSocketShard) {
    const { d: data } = packet;
    READY.apply(this, [client, packet, {checkReady: () => {}}]);
    client.user.settings = data.user_settings ? new ClientUserSettings(client.user, data.user_settings) : null;
    for (const privateDM of data.private_channels) {
      client.channels.add(privateDM);
    }
    if (data.notes) {
      for (const user of Object.keys(data.notes)) {
        let note = data.notes[user];
        if (!note.length) note = null;

        client.user.notes.set(user, note);
      }
    }
    client.read_state = data.read_state;
    // @ts-ignore
    shard.checkReady();
  },
  USER_NOTE_UPDATE: function UserNoteUpdateHandler(client: any, packet: any) {
    client.actions.UserNoteUpdate.handle(packet.d);
  },
  USER_SETTINGS_UPDATE: function UserSettingsUpdateHandler(client: any, packet: any) {
    client.user.settings._patch(packet.d);
    client.actions.UserSettingsUpdate.handle(packet.d);
  }
});