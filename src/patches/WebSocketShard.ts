import { Constants } from 'discord.js';

const WebSocketShard = require('discord.js/src/client/websocket/WebSocketShard');

const { Status, ShardEvents } = Constants;

WebSocketShard.prototype.checkReady = function checkReady() {
  this.status = Status.READY;
  // @ts-ignore
  this.emit(ShardEvents.ALL_READY);
  this.manager.client.shard = this;
};
