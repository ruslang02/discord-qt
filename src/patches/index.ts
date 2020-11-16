import { createLogger } from "../utilities/Console";

export const Patches = [
  require('./QWidget'),
  require('./Prism'),
  require('./SecretBox'),
  require('./StreamDispatcher'),
  require('./Constants'),
  require('./TextBasedChannel'),
  require('./ClientUser'),
  require('./ClientPresence'),
  require('./User'),
  require('./Guild'),
  require('./GuildChannel'),
  require('./WebSocketShard'),
  require('./Handlers'),
  require('./RESTManager'),
  require('./ActionsManager'),
];

createLogger('Patches').log(`Applied ${Patches.length} patches.`);