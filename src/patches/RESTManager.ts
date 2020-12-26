import { Client } from 'discord.js';
import { patchClass } from '../utilities/Patcher';

const RESTManager = require('discord.js/src/rest/RESTManager');

class RESTManagerPatch {
  client?: Client;

  getAuth() {
    const token = this.client?.token;

    if (token) {
      return token;
    }

    throw new Error('TOKEN_MISSING');
  }
}

patchClass(RESTManager.prototype, RESTManagerPatch);
