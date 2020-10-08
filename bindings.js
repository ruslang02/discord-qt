module.exports = exports = function (str) {
  switch (str) {
    case "pulse.node": {
      const result = require("./node_modules/pulseaudio2/build/Release/pulse.node");
      result.path = "./node_modules/pulseaudio2/build/Release/pulse.node";
      return result;
    }
  }
};
