import { Permissions } from 'discord.js';

const Guild = require('discord.js/src/structures/Guild');

Object.defineProperty(Guild.prototype, 'acknowledged', {
  get: function () {
    return this.channels.cache
      .filter((channel: any) => ['news', 'text'].includes(channel.type) && channel.can(Permissions.FLAGS.VIEW_CHANNEL))
      .every((channel: any) => channel.acknowledged);
  }
});

Object.defineProperty(Guild.prototype, 'position', {
  get: function () {
    if (this.client.user.bot) return null;
    if (!this.client.user.settings.guildPositions) return null;
    return this.client.user.settings.guildPositions.indexOf(this.id);
  }
});

const _superPatch = Guild.prototype._patch;
Guild.prototype._patch = function() {
  _superPatch.apply(this, arguments);
  setTimeout(() => this.shardID = 0);
}

Guild.prototype.subscribeToTypingEvent = function subscribeToTypingEvent() {
  this.client.shard?.send({
    op: 14,
    d: { guild_id: this.id, typing: true, activities: true },
  });
}