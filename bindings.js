module.exports = exports = function (str) {
  if (process.platform !== "linux") return;
  switch (str) {
    case "pulse.node": {
      try {
        const result = require("./node_modules/pulseaudio2/build/Release/pulse.node");
        result.path = "./node_modules/pulseaudio2/build/Release/pulse.node";
        return result;
      } catch (e) { }
    }
  }
};
