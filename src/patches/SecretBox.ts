const secretbox = require('discord.js/src/client/voice/util/Secretbox');
const tweetnacl = require('tweetnacl');
secretbox.methods = {
  open: tweetnacl.secretbox.open,
  close: tweetnacl.secretbox,
  random: (n) => tweetnacl.randomBytes(n),
};
