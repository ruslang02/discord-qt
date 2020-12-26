import { Constants, DQConstants, ShardingManager } from 'discord.js';
import { patchClass } from '../utilities/Patcher';

const WebSocketShard = require('discord.js/src/client/websocket/WebSocketShard');

const { Status, ShardEvents } = Constants as DQConstants;

class WebSocketShardPatch {
  manager?: ShardingManager;

  status?: typeof Status[keyof typeof Status];

  checkReady(this: typeof WebSocketShard) {
    this.status = Status.READY;
    this.emit(ShardEvents.ALL_READY);
    this.manager.client.shard = this;
  }
}

patchClass(WebSocketShard.prototype, WebSocketShardPatch);
