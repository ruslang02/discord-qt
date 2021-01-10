import { existsSync, mkdirSync, promises } from 'fs';
import { dirname, join } from 'path';
import { app } from '..';
import { createLogger } from './Console';
import { Events } from './Events';
import { IConfig } from './IConfig';

const { readFile, writeFile } = promises;
const { log, error } = createLogger('Config');

export class ConfigManager {
  isLoaded = false;

  private config = {} as IConfig;

  constructor(private file: string) {
    mkdirSync(dirname(file), { recursive: true });

    setInterval(() => {
      void this.save();
    }, 1000);
  }

  async load() {
    const { file } = this;

    this.isLoaded = false;

    let config = {} as IConfig;

    try {
      config = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      if (!existsSync(file)) {
        writeFile(file, '{}', 'utf8').catch((e) => {
          error('Missing permissions on the config file.', e);
        });
      } else {
        error('Config file could not be used, returning to default values...');
      }
    }

    this.config = {
      accounts: config.accounts ?? [],
      debug: config.debug ?? false,
      enableAvatars: config.enableAvatars ?? true,
      fastLaunch: config.fastLaunch ?? false,
      hideMembersList: config.hideMembersList ?? false,
      isMobile: config.isMobile ?? false,
      locale: config.locale ?? 'en-US',
      minimizeToTray: config.minimizeToTray ?? true,
      overlaySettings: config.overlaySettings ?? {},
      processMarkDown: config.processMarkDown ?? true,
      recentEmojis: config.recentEmojis ?? [],
      roundifyAvatars: config.roundifyAvatars ?? true,
      theme: config.theme ?? 'dark',
      userVolumeSettings: config.userVolumeSettings ?? {},
      userLocalGuildSettings: config.userLocalGuildSettings ?? {},
      voiceSettings: config.voiceSettings ?? {},
      zoomLevel: config.zoomLevel ?? '1.0',
    };

    if (config.debug === true) {
      log('Loaded config:', config);
    }

    this.isLoaded = true;
  }

  get<T extends keyof IConfig>(id: T): IConfig[T] {
    return this.config[id];
  }

  set<T extends keyof IConfig>(id: T, value: IConfig[T]) {
    this.config[id] = value;
  }

  async save() {
    if (!this.isLoaded) return;

    try {
      await writeFile(join(this.file), JSON.stringify(this.config));
      app.emit(Events.CONFIG_UPDATE, this);
    } catch (e) {
      error(e);
    }
  }
}
