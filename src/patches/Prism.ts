import opusscript from 'opusscript';

const Loader = require('prism-media/src/util/loader');

try {
  Loader.require = function load() {
    return { Encoder: opusscript };
  };
} catch (e) {}
