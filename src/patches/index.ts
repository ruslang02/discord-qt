/* eslint-disable global-require */
import { createLogger } from '../utilities/Console';

// Patches loading order
export const Patches = [
  require('./Constants'),
  require('./NodeAddon'),
  require('./NodeWidget'),
  require('./Prism'),
  require('./SecretBox'),
  require('./StreamDispatcher'),
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
