import { Account } from './Account';

export abstract class IConfig {
  accounts?: Account[];
  roundifyAvatars?: boolean;
  fastLaunch?: boolean;
  debug?: boolean;
  processMarkDown?: boolean;
  enableAvatars?: boolean;
}