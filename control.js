// Command line options.
var cmd = require("node-getopt").create([
  ["p", "port=ARG", "Port on which to listen for http requests"],
  ["h", "help", "Display this help message"]
]).bindHelp().parseSystem();

// Http request handler.
var server = require("./lib/controllerHttp");

// Start the data request handler on designated or default port.
server.listen(cmd.options.port || 3001);
