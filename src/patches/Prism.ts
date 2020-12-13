const Loader = require('prism-media/src/util/loader');
const Opus = require('@discordjs/opus/build-tmp-napi-v3/Release/opus.node');

try {
  Loader.require = function load() {
    return { Encoder: Opus.OpusEncoder };
  };
} catch (e) {}
