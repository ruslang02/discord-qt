const Loader = require('prism-media/src/util/loader');
const Opus = require('opusscript')
Loader.require = function load() {
  return { Encoder: Opus };
}