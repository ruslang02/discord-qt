import { IConfig } from './IConfig';
import { dirname, join } from 'path';
import fs, { existsSync } from 'fs';

const { mkdir, readFile, writeFile } = fs.promises;
export class Config extends IConfig {
  isLoaded = false;

  constructor(
    private file: string,
  ) {
    super();
  }

  async load() {
    const { file } = this;
    await mkdir(dirname(file), { recursive: true });
    this.isLoaded = false;
    let config: IConfig;
    try {
      config = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      if (!existsSync(file))
        await writeFile(file, '{}', 'utf8');
      else console.error('Config file could not be used, returning to default values...');
      config = {};
    }
    Object.assign(this, {
      accounts: config.accounts ?? [],
      roundifyAvatars: config.roundifyAvatars ?? true,
      fastLaunch: config.fastLaunch ?? false,
      debug: config.debug ?? false,
      enableAvatars: config.enableAvatars ?? true,
      processMarkDown: config.processMarkDown ?? true,
      theme: config.theme ?? 'dark',
      locale: config.locale ?? 'en-US',
      recentEmojis: config.recentEmojis ?? [],
    } as IConfig);
    if (config.debug === true)
      console.log('Loaded config:', this);
    this.isLoaded = true;
  }
  async save() {
    try {
      let obj = { ...this };
      delete obj.file;
      delete obj.isLoaded;

      await writeFile(join(this.file), JSON.stringify(obj))
    } catch (e) {
      console.error(e);
    }
  }
}