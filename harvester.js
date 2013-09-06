// Command line options.
var cmd = require("node-getopt").create([
  ["h", "help", "Display this help message"],
  ["t", "thresh=", "Interval at which threshing is repeated"]
]).bindHelp().parseSystem();

// Deps
var
  harvey     = require("./lib/harvester");

// Start threshing the internet crop.
harvey.thresh({
  threshInt: cmd.options.thresh
});
// XXX
// Stop the thresher
// harvey.stopThresher();
