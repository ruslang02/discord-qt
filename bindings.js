module.exports = exports = function (str) {
  if(str === "binding"){
      const result = require("./node_modules/speaker/build/Release/binding.node");
      result.path = "./node_modules/speaker/build/Release/binding.node";
      return result;
  }
};
