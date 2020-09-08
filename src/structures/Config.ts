import { IConfig } from './IConfig';
import { dirname, join } from 'path';
import fs, { existsSync } from 'fs';

const { mkdir, readFile, writeFile } = fs.promises;
export class Config extends IConfig {
  locale = "en-US";
  
  constructor(
    private file: string,
  ) {
    super();
  }

  async load() {
    const { file } = this;
    await mkdir(dirname(file), {recursive: true});
    try {
      const {accounts, roundifyAvatars, fastLaunch, debug, enableAvatars, processMarkDown, recentEmojis, theme, locale} = 
        JSON.parse(await readFile(file, 'utf8'));
      const appConfig = {
        accounts: accounts || [],
        roundifyAvatars: roundifyAvatars ?? true,
        fastLaunch: fastLaunch ?? false,
        debug: debug ?? false,
        enableAvatars: enableAvatars ?? true,
        processMarkDown: processMarkDown ?? true,
        theme: theme ?? 'dark',
        locale: locale ?? 'en',
        recentEmojis: recentEmojis ?? [],
      } as IConfig;
      Object.assign(this, appConfig);
      if (appConfig.debug === true) console.log('Loaded config:', appConfig);
    } catch(err) {
      if (!existsSync(file))
        await writeFile(file, '{}', 'utf8');
      else console.error('Config file could not be used, returning to default values...');
      Object.assign(this, {
        accounts: [],
        roundifyAvatars: true,
        fastLaunch: false,
        debug: false,
        enableAvatars: true,
        processMarkDown: true,
        theme: 'dark',
        locale: 'en',
        recentEmojis: [],
      });
    }
  }
  async save() {
    try {
      await writeFile(join(this.file), JSON.stringify(this))
    } catch(e) {
      console.error(e);
    }
  }
}