// Command line options.
var cmd = require("node-getopt").create([
  ["p", "port=", "Port on which to listen for data requests"],
  ["h", "help", "Display this help message"]
]).bindHelp().parseSystem();

// Http request handler.
var
  httpHandler = require("./lib/httpRequestHandler");
  server      = require("http").createServer(httpHandler);

// Web socket handler.
var
  wsHandler   = require("./lib/wsRequestHandler").listen(server);

// Start the data request handler on designated or default port.
server.listen(cmd.options.port || 3000);
