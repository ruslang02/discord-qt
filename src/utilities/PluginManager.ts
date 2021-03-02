import Discord from 'discord.js';
import { mkdirSync, promises, readdirSync } from 'fs';
import { join } from 'path';
import Qt from '@nodegui/nodegui';
import { app } from '..';
import { createLogger } from './Console';
import { paths } from './Paths';
import { Plugin } from './Plugin';

const { readFile } = promises;

const { log, error, warn } = createLogger('PluginManager');

// @ts-ignore
// eslint-disable-next-line
const nodeRequire = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;

export class PluginManager {
  static readonly searchDirs = [join(paths.config, 'plugins'), join(__dirname, 'plugins')];

  static readonly keywords = ['discord-qt', 'plugin'];

  plugins = new Map<string, Plugin>();

  async reload() {
    this.plugins.forEach((plugin) => plugin.destroy && plugin.destroy());
    this.plugins.clear();
    let tasks: Promise<any>[] = [];

    PluginManager.searchDirs
      .map((dir) => this.recursiveSearch(dir))
      .forEach((searcher) => {
        tasks = [...tasks, ...searcher];
      });

    await Promise.all(tasks);
    log('Loaded', this.plugins.size, 'plugins.');
  }

  recursiveSearch(root: string): Promise<any>[] {
    try {
      mkdirSync(root, { recursive: true });
      const dirs = readdirSync(root, { withFileTypes: true }).filter(
        (dir) => !['.git', 'node_modules'].includes(dir.name)
      );

      let tasks: Promise<any>[] = [];

      for (const dir of dirs) {
        const path = join(root, dir.name);

        if (dir.isDirectory()) {
          const searcher = this.recursiveSearch(path);

          tasks = [...tasks, ...searcher];
        } else if (dir.name === 'package.json' && dir.isFile()) {
          const reader = readFile(path).then((contents) => {
            const pkg = JSON.parse(contents.toString()) as { main: string; keywords: string[] };

            if (
              pkg.keywords &&
              Array.isArray(pkg.keywords) &&
              PluginManager.keywords.every((word) => pkg.keywords.includes(word))
            ) {
              const mainPath = join(root, pkg.main);

              try {
                const PluginClass = nodeRequire(mainPath);
                const plugin = new PluginClass({
                  app,
                  Qt,
                  createLogger,
                  Discord,
                  module,
                });

                this.plugins.set(mainPath, plugin);
              } catch (e) {
                error('Failed to load plugin', root, e);
              }
            }
          });

          tasks = [...tasks, reader];
        }
      }

      return tasks;
    } catch (e) {
      warn('Could not load plugins.');

      return [];
    }
  }
}
