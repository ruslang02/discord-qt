import { ClientOptions } from 'discord.js';

const { version } = require('../../package.json');

export const clientOptions: ClientOptions = {
  ws: {
    compress: false,
    properties: {
      // @ts-ignore
      os: process.platform,
      browser: 'DiscordQt',
      release_channel: 'stable',
      client_version: version,
      os_arch: process.arch,
      // @ts-ignore
      client_build_number: __BUILDNUM__ || 0,
    },
  },
};
