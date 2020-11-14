import { createLogger } from '../utilities/Console';

const ActionsManager = require('./ActionsManager');
const ClientUser = require('./ClientUser');
const ClientPresence = require('./ClientPresence');
const Constants = require('./Constants');
const Guild = require('./Guild');
const GuildChannel = require('./GuildChannel');
const Handlers = require('./Handlers');
const Prims = require('./Prism');
const QWidget = require('./QWidget');
const RESTManager = require('./RESTManager');
const SecretBox = require('./SecretBox');
const StreamDispatch = require('./StreamDispatcher');
const TextBasedChannel = require('./TextBasedChannel');
const User = require('./User');
const WebSocketShard = require('./WebSocketShard');

export const Patches = [
  ActionsManager,
  ClientUser,
  ClientPresence,
  Constants,
  Guild,
  GuildChannel,
  Handlers,
  Prims,
  QWidget,
  RESTManager,
  SecretBox,
  StreamDispatch,
  TextBasedChannel,
  User,
  WebSocketShard,
];

createLogger('Patches').log(`Applied ${Patches.length} patches.`);
