const ClientPresence = require('discord.js/src/structures/ClientUser');
const _superParse = ClientPresence.prototype._parse;
ClientPresence.prototype._parse = function _parse({ activities }: any) {
  const packet = _superParse.apply(this, arguments) as any;
  if (activities) packet.activities = activities;
  return packet;
}