import { createLogger } from "../utilities/Console";

export const Patches = [
  require('./Constants'),
  require('./TextBasedChannel'),
  require('./ClientUser'),
  require('./ClientPresence'),
  require('./Guild'),
  require('./GuildChannel'),
  require('./WebSocketShard'),
  require('./Handlers'),
  require('./RESTManager'),
  require('./ActionsManager'),
];

createLogger('Patches').log(`Applied ${Patches.length} patches.`);