import { WebSocketShard, Constants, WSEventType, WebSocketManager, Client } from 'discord.js';
import READY from './handlers/READY';
import USER_SETTINGS_UPDATE from './handlers/USER_SETTINGS_UPDATE';

const { WSEvents, Status } = Constants;
const WSManager = require('discord.js/src/client/websocket/WebSocketManager') as new (client: Client) => WebSocketManager;
const PacketHandlers = {
  ...require('discord.js/src/client/websocket/handlers'),
  READY,
  USER_SETTINGS_UPDATE
};

const BeforeReadyWhitelist = [
  WSEvents.READY,
  WSEvents.RESUMED,
  WSEvents.GUILD_CREATE,
  WSEvents.GUILD_DELETE,
  WSEvents.GUILD_MEMBERS_CHUNK,
  WSEvents.GUILD_MEMBER_ADD,
  WSEvents.GUILD_MEMBER_REMOVE,
];

export type Packet = {
  op: number,
  d: any,
  s: number,
  t: WSEventType
};
// @ts-ignore: We need to override a private method.
export class DQWebSocketManager extends WSManager {
  private handlePacket(packet?: Packet, shard?: WebSocketShard): boolean {
    if (packet && this.status !== Status.READY) {
      if (!BeforeReadyWhitelist.includes(packet.t as any)) {
        // @ts-ignore
        this.packetQueue.push({ packet, shard });
        return false;
      }
    }

    // @ts-ignore
    if (this.packetQueue.length) {
      // @ts-ignore
      const item = this.packetQueue.shift();
      this.client.setImmediate(() => {
        // @ts-ignore
        this.handlePacket(item.packet, item.shard);
      });
    }

    if (packet && PacketHandlers[packet.t]) {
      PacketHandlers[packet.t](this.client, packet, shard);
    }
    return true;
  }
}