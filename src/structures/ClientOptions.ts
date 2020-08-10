import { ClientOptions } from 'discord.js';

const { version, name } = require('../../package.json');

export const clientOptions: ClientOptions = {
  useUserGateway: true,
  waitForGuildsTimeout: 0,
  userAgent: `Discord-Qt/${version} Node.js/${process.version}`,
  ws: {
    compress: false,
    // @ts-ignore
    properties: {
      os: process.platform,
      browser: "DiscordQt",
      release_channel: "stable",
      client_version: version,
      os_arch: process.arch,
      // @ts-ignore
      client_build_number: __BUILDNUM__ || 0,
    }
  }
};