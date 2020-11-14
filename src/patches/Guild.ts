import { Permissions } from 'discord.js';

const Guild = require('discord.js/src/structures/Guild');

Object.defineProperty(Guild.prototype, 'acknowledged', {
  get() {
    return this.channels.cache
      .filter(
        (channel: any) =>
          ['news', 'text'].includes(channel.type) &&
          channel.can(Permissions.FLAGS.VIEW_CHANNEL) &&
          !channel.muted,
      )
      .every((channel: any) => channel.acknowledged);
  },
});

Object.defineProperty(Guild.prototype, 'position', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    if (!this.client.user.settings.guildPositions) {
      return null;
    }
    return this.client.user.settings.guildPositions.indexOf(this.id);
  },
});

Object.defineProperty(Guild.prototype, 'muted', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      return this.client.user.guildSettings.get(this.id).muted;
    } catch (err) {
      return false;
    }
  },
});

Object.defineProperty(Guild.prototype, 'messageNotifications', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      return this.client.user.guildSettings.get(this.id).messageNotifications;
    } catch (err) {
      return null;
    }
  },
});

Object.defineProperty(Guild.prototype, 'mobilePush', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      return this.client.user.guildSettings.get(this.id).mobilePush;
    } catch (err) {
      return null;
    }
  },
});

Object.defineProperty(Guild.prototype, 'suppressEveryone', {
  get() {
    if (this.client.user.bot) {
      return null;
    }
    try {
      return this.client.user.guildSettings.get(this.id).suppressEveryone;
    } catch (err) {
      return null;
    }
  },
});

const _superPatch = Guild.prototype._patch;
Guild.prototype._patch = function _patch(...args: any[]) {
  _superPatch.apply(this, ...args);
  setTimeout(() => {
    this.shardID = 0;
  }, 0);
};

Guild.prototype.subscribeToTypingEvent = function subscribeToTypingEvent() {
  this.client.shard?.send({
    op: 14,
    d: { guild_id: this.id, typing: true, activities: true },
  });
};
