const RESTManager = require('discord.js/src/rest/RESTManager');

RESTManager.prototype.getAuth = function getAuth() {
  const token = this.client.token || this.client.accessToken;
  if (token) return token;
  throw new Error('TOKEN_MISSING');
};
