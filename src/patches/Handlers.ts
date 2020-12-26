import { Constants, DQConstants, WebSocketShard } from 'discord.js';

import { ClientUserGuildSettings } from './ClientUserGuildSettings';
import { ClientUserSettings } from './ClientUserSettings';

const handlers = require('discord.js/src/client/websocket/handlers/index');
const READY = require('discord.js/src/client/websocket/handlers/READY');

Object.assign(handlers, {
  MESSAGE_ACK: function MessageAcknowledgedHandler(client: any, packet: any) {
    client.actions.MessageAcknowledged.handle(packet.d);
  },

  READY: function ReadyHandler(client: any, packet: any, shard: WebSocketShard) {
    const { d: data } = packet;

    READY.apply(this, [client, packet, { checkReady: () => {} }]);

    if (data.user_settings) {
      const { user } = client;

      user.settings = new ClientUserSettings(client.user, data.user_settings);
    }

    if (data.user_guild_settings) {
      for (const settings of data.user_guild_settings) {
        client.user.guildSettings.set(
          settings.guild_id,
          new ClientUserGuildSettings(settings, client)
        );
      }
    }

    for (const privateDM of data.private_channels) {
      client.channels.add(privateDM);
    }

    if (data.notes) {
      for (const user of Object.keys(data.notes)) {
        let note = data.notes[user];

        if (!note?.length) {
          note = null;
        }

        client.user.notes.set(user, note);
      }
    }

    // eslint-disable-next-line no-param-reassign
    client.read_state = data.read_state;

    // @ts-ignore
    shard.checkReady();
  },

  USER_GUILD_SETTINGS_UPDATE: function UserGuildSettingsUpdate(client: any, packet: any) {
    const settings = client.user.guildSettings.get(packet.d.guild_id);

    if (settings) {
      settings.patch(packet.d);
    } else {
      client.user.guildSettings.set(
        packet.d.guild_id,
        new ClientUserGuildSettings(packet.d, client)
      );
    }

    client.emit(
      (Constants as DQConstants).Events.USER_GUILD_SETTINGS_UPDATE,
      client.user.guildSettings.get(packet.d.guild_id)
    );
  },

  USER_NOTE_UPDATE: function UserNoteUpdateHandler(client: any, packet: any) {
    client.actions.UserNoteUpdate.handle(packet.d);
  },

  USER_SETTINGS_UPDATE: function UserSettingsUpdateHandler(client: any, packet: any) {
    client.user.settings._patch(packet.d);
    client.actions.UserSettingsUpdate.handle(packet.d);
  },
});
