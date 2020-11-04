const Loader = require('prism-media/src/util/loader');
try {
  const Opus = require('opusscript')
  Loader.require = function load() {
    return { Encoder: Opus };
  }
} catch (e) { }
