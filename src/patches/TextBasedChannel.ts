import { Permissions } from 'discord.js';
import { SnowflakeUtil } from 'discord.js';

const TextBasedChannel = require('discord.js/src/structures/interfaces/TextBasedChannel');

const props = [
  'lastReadMessageID',
  'acknowledged',
  'acknowledge'
];

Object.defineProperty(TextBasedChannel.prototype, 'lastReadMessageID', {
  get: function () {
    const state = this.client.read_state.find((s: any) => s.id === this.id);
    return state?.last_message_id || null;
  }
});

Object.defineProperty(TextBasedChannel.prototype, 'acknowledged', {
  get: function () {
    return this.lastReadMessageID === this.lastMessageID
  }
});

TextBasedChannel.prototype.acknowledge = function () {
  if (!this.lastMessageID) return;
  this.client.api.channels[this.id].messages[this.lastMessageID].ack.post({ data: { token: this._ackToken } }).then((res: any) => {
    if (res.token) this._ackToken = res.token;
  });
}

const _applyToClass = TextBasedChannel.applyToClass;
TextBasedChannel.applyToClass = function (structure: any, full = false, ignore: string[] = []) {
  _applyToClass(structure, full, ignore);
  for (const prop of props) {
    if (ignore.includes(prop)) continue;
    Object.defineProperty(
      structure.prototype,
      prop,
      Object.getOwnPropertyDescriptor(TextBasedChannel.prototype, prop) as PropertyDescriptor,
    );
  }
}