import { DQClient } from '../../Client';
import { Packet } from '../WebSocketManager';
import { WebSocketShard } from 'discord.js';
import { DQClientUser } from '../../../structures/ClientUser';

export default function ReadyHandler(client: DQClient, { d: data }: Packet, shard: WebSocketShard) {
  if (client.user) {
    // @ts-ignore
    client.user._patch(data.user);
  } else {
    const clientUser = new DQClientUser(client, data);
    client.user = clientUser;
    client.users.cache.set(clientUser.id, clientUser);
  }

  for (const guild of data.guilds) {
    guild.shardID = shard.id;
    
    client.guilds.add(guild);
  }

  for (const privateDM of data.private_channels) {
    client.channels.add(privateDM);
  }
  // @ts-ignore
  shard.checkReady();
};
