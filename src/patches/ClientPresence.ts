import { Activity } from 'discord.js';

const ClientPresence = require('discord.js/src/structures/ClientPresence');

const _superParse = ClientPresence.prototype._parse;
let custom: Activity;

ClientPresence.prototype._parse = async function _parse(data: any, ...args: any[]) {
  const packet = (await _superParse.apply(this, [data, ...args])) as any;

  if (data.customStatus) {
    custom = data.customStatus;
  }

  packet.activities = [];

  if (custom) {
    packet.activities.push(custom);
  }

  if (packet.game) {
    packet.activities.push(packet.game);
  }

  delete packet.game;
  const prev = { ...this };

  this.patch(packet);
  this.client.emit('presenceUpdate', prev, this);

  return packet;
};
