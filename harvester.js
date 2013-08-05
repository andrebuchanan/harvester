// Command line options.
var cmd = require("node-getopt").create([
  ["p", "port=", "Port on which to listen for data requests"],
  ["h", "help", "Display this help message"],
  ["t", "thresh=", "Interval at which threshing is repeated"],
  ["k", "fskey=", "FlightStats API key"]
]).bindHelp().parseSystem();

// Deps
var
  reqHandler = require("./lib/requestHandler"),
  harvey     = require("./lib/harvester");

// Start the data request handler on designated or default port.
reqHandler.listen(cmd.options.port || 3000);

// Start threshing the internet crop.
harvey.thresh({
  threshInt: cmd.options.thresh,
  fsKey: cmd.options.fskey
});
// XXX
// Stop the thresher
// harvey.stopThresher();
