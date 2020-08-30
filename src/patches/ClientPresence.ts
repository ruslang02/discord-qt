const ClientPresence = require('discord.js/src/structures/ClientPresence');
const _superParse = ClientPresence.prototype._parse;
ClientPresence.prototype._parse = async function _parse({ activities }: any) {
  const packet = await _superParse.apply(this, arguments) as any;
  if (activities) {
    packet.activities = activities;
    packet.game = packet.game || activities[0]
  };
  return packet;
}