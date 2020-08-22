import { Client, WebSocketManager } from 'discord.js';
import { DQWebSocketManager } from './websocket/WebSocketManager';
import { DQClientUser } from '../structures/ClientUser';
import { DQGuildManager } from '../managers/GuildManager';
import { DQClientPresence } from '../structures/ClientPresence';
import { DQActionsManager } from './actions/ActionsManager';

export class DQClient extends Client {
  user: DQClientUser | null = null;
  // @ts-ignore
  guilds = new DQGuildManager(this);

  /**
   * The presence of the Client
   * @private
   * @type {DQClientPresence}
   */
  // @ts-ignore
  presence = new DQClientPresence(this);

  /**
   * The action manager of the client
   * @type {DQActionsManager}
   * @private
   */
  actions = new DQActionsManager(this);

  constructor(options = {}) {
    // @ts-ignore
    super({ _tokenType: '', ...options });

    // @ts-ignore
    this.ws = new DQWebSocketManager(this) as unknown as WebSocketManager;
  }
}
