// Command line options.
var cmd = require("node-getopt").create([
  ["p", "port=", "Port on which to listen for data requests"],
  ["h", "help", "Display this help message"]
]).bindHelp().parseSystem();

// Deps
var
  reqHandler = require("./lib/requestHandler");

// Start the data request handler on designated or default port.
reqHandler.listen(cmd.options.port || 3000);
