import { Client, WebSocketManager } from 'discord.js';
import { DQWebSocketManager } from './websocket/WebSocketManager';
import { DQClientUser } from '../structures/ClientUser';
import { DQGuildManager } from '../managers/GuildManager';

export class DQClient extends Client {
  user: DQClientUser | null = null;
  // @ts-ignore
  guilds = new DQGuildManager(this);

  constructor(options = {}) {
    // @ts-ignore
    super({_tokenType: '', ...options});

    // @ts-ignore
    this.ws = new DQWebSocketManager(this) as unknown as WebSocketManager;
  }
}
