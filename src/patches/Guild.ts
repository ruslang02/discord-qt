const Guild = require('discord.js/src/structures/Guild');

Object.defineProperty(Guild.prototype, 'position', {
  get: function () {
    if (this.client.user.bot) return null;
    if (!this.client.user.settings.guildPositions) return null;
    return this.client.user.settings.guildPositions.indexOf(this.id);
  }
});