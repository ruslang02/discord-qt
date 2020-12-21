import { join } from 'path';
import { readFileSync } from 'fs';
import { paths } from './Paths';
import { createLogger } from './Console';

const { warn } = createLogger('PreLaunchConfigManager');

const CONFIG_PATH = join(paths.config, 'config.json');

function run() {
  try {
    const json = readFileSync(CONFIG_PATH).toString();
    const config = JSON.parse(json);

    process.env.QT_SCALE_FACTOR = config.zoomLevel;
  } catch (e) {
    warn('Could not load config file.');
  }
}

run();
