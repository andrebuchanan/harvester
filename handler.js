// Command line options.
var cmd = require("node-getopt").create([
  ["p", "port=ARG", "Port on which to listen for data requests"],
  ["t", "test", "Serve static content from testclient directory"],
  ["h", "help", "Display this help message"]
]).bindHelp().parseSystem();

// Http request handler.
var
  httpHandler = require("./lib/httpRequestHandler");
  server      = require("http").createServer(httpHandler),
  express     = require("express");

// Web socket handler.
var
  wsHandler   = require("./lib/wsRequestHandler").listen(server);

console.log(cmd.options);
// Test client setup.
if (cmd.options.test)
{
  httpHandler.use(express.static("./testclient/", { maxAge: 1 }));
}

// Start the data request handler on designated or default port.
server.listen(cmd.options.port || 3000);
