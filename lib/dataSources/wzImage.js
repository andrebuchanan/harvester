// Deps
var
  requester = require("./requester.js"),
  Events  = require("events").EventEmitter,
  moment  = require("moment-timezone"),
  fs      = require("fs"),
  util    = require("util");
var
  log     = util.log;

// Report name of data source.
exports.name = "WeatherZone Radar Image";
exports.dataType = "weather-image";

// Other stuff.
var MINUTE = 60000; // Milliseconds.
var HOUR = MINUTE * 60; // Milliseconds.

var urls = require("./wzImage.json");
// Light error checking on urls structure.
urls.forEach(function(url)
{
  if (!(url.url && url.portCode)) throw exports.name + " url definition not complete.";
});

// Check length of urls array. If no elements, throw error.
if (urls.length === 0)
{
  throw "No urls defined for " + exports.name;
}

// Obtain auth from environment.
var
  authUser = process.env.WZ_AUTH_USER,
  authPass = process.env.WZ_AUTH_PASS;
// If these are not present, throw exception.
if (!(authUser && authPass))
{
  throw "Cannot use " + exports.name + " without credentials.";
}

// Generic request options.
// Generic request options.
var reqOptions = {
  method: "GET",
  proxy: (process.env ? process.env.http_proxy : null),
  url: null, // Updated in the requester
  qs: {
    "service":"WMS",
    "version":"1.1.0",
    "request":"GetMap",
    "layers":"wz:radar_composite_latest",
    "width":"1024",
    "height":"1024",
    "srs":"EPSG:4326",
    "format":"image/png"
  },
  headers: {
    Host: "geo.theweather.com.au"
  },
  auth: {
    "user": authUser,
    "pass": authPass
  }
};

var lastRun = null; // The last time this store collected data.
// Collect data from web service providers.
exports.collect = collect;
function collect(harvesterCb)
{
  // Define callback functions.
  //
  // Get data from this data source every minute.
  var runCheck = function()
  {
    if (lastRun !== null && Date.now() - lastRun < MINUTE )
    {
      return false;
    }

    lastRun = Date.now();
    // Otherwise do not run.
    return true;
  };
  // The response should contain a flightStatuses array.
  var responseCb = function(url, error, data)
  {
    log(typeof data);
    fs.write("test.png", data, function()
    {
      log("saved");
    });
  };

  // Use the default requester to obtain a response from the web service.
  return requester.collect(
    // Options for each request.
    reqOptions,
    // Data source URLs
    urls,
    // The default requester requires a callback which will tell it when it can
    // make a new request to the web service. The callback must return true or false.
    runCheck,
    // This callback is used to error-check the response in the context of the data source.
    // General errors are handled by the harvester and / or requester.
    responseCb,
    // This callback is passed through from the harvester.
    harvesterCb
  );
}

// Process aircraft data.
exports.auger = function(input)
{
  var processor = new Events();

  // Begin processing.
  process.nextTick(function()
  {
    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", null);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
}

// Save the data.
exports.saveData = function (store, data, something)
{
  log(exports.name + " saving data");
}
