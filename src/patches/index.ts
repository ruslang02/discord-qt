import { createLogger } from '../utilities/Console';

const QWidget = require('./QWidget');
const Prism = require('./Prism');
const SecretBox = require('./SecretBox');
const StreamDispatch = require('./StreamDispatcher');
const Constants = require('./Constants');
const TextBasedChannel = require('./TextBasedChannel');
const ClientUser = require('./ClientUser');
const ClientPresence = require('./ClientPresence');
const User = require('./User');
const Guild = require('./Guild');
const GuildChannel = require('./GuildChannel');
const WebSocketShard = require('./WebSocketShard');
const Handlers = require('./Handlers');
const RESTManager = require('./RESTManager');
const ActionsManager = require('./ActionsManager');

export const Patches = [
  QWidget,
  Prism,
  SecretBox,
  StreamDispatch,
  Constants,
  TextBasedChannel,
  ClientUser,
  ClientPresence,
  User,
  Guild,
  GuildChannel,
  WebSocketShard,
  Handlers,
  RESTManager,
  ActionsManager,
];

createLogger('Patches').log(`Applied ${Patches.length} patches.`);
