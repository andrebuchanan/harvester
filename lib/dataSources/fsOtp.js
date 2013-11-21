// Deps
var
  requester = require("./requester.js"),
  Events  = require("events").EventEmitter,
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone"),
  util    = require("util");
var
  log     = util.log;

// Report name of data source.
exports.name = "FlightStats OTP";

// Other stuff.
var MINUTE = 60000; // Milliseconds.
var HOUR = MINUTE * 60; // Milliseconds.

var urls = require("./fsOtp.json");
// Light error checking on urls structure.
urls.forEach(function(url)
{
  if (!(url.url && url.carrier)) throw "OTP url definition not complete.";
});

// Check length of urls array. If no elements, throw error.
if (urls.length === 0)
{
  throw "No urls defined for OTP data source.";
}

// Obtain app id and app key from environment.
var
  appId = process.env.FS_APP_ID,
  appKey = process.env.FS_APP_KEY;
// If these are not present, throw exception.
if (!(appId && appKey))
{
  throw "Cannot use FlightStats data source without credentials.";
}

// Generic request options.
// Generic request options.
var reqOptions = {
  method: "GET",
  proxy: (process.env ? process.env.http_proxy : null),
  url: null, // Updated in the requester
  qs: {
    "appId": appId,
    "appKey": appKey,
    "extendedOptions": "useHttpErrors"
  },
  headers: {
    Host: "api.flightstats.com"
  },
  json: true
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
    // Collect data every hour.
    if (lastRun !== null && Date.now() - lastRun < MINUTE)
    {
      return false;
    }
    // This data source was last run at the current time.
    lastRun = Date.now();
    return true;
  };
  // The response should contain a flightStatuses array.
  var responseCb = function(url, error, data)
  {
    if (!data.flightStatuses)
    {
      var errMsg = error.error = "No flight status data found in response.";
      log(errMsg);
      return false;
    }
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
  var parsedInput = {};
  var aircrafts = [];
  var aircraft;

  // Begin processing.
  process.nextTick(function()
  {
    try
    {
      parsedInput = JSON.parse(input);
    }
    catch(e)
    {
      processor.emit("error", e);
    }

    // Process aircraft.
    for (item in parsedInput)
    {
      var ary = parsedInput[item];
      // Aircraft items are arrays. Only process those.
      if (typeof ary === "object" && Array.isArray(ary))
      {
        aircraft = {};
        aircraft[CTI.aircraftTail]    = ary[9].replace("-", ""); // This is a primary key. Should be proper rego.
        aircraft[CTI.equipment]       = ary[8];
        aircraft[CTI.fullFlightCode]  = ary[16] || ""; // This is a range key. Must be proper flight code.
        aircraft[CTI.updateTime]      = Math.floor(moment().utc().valueOf() / 1000);

        // Check integrity of data and add to array if all is well.
        if (aircraft[CTI.aircraftTail].length > 1 &&
          aircraft[CTI.equipment].length > 1 &&
          aircraft[CTI.fullFlightCode].length > 1)
        {
          aircrafts.push(aircraft);
        }
      }
    }
    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", aircrafts);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
}

// Save the data. The intention of this function is to provide a place where flight stats
// specific, pre-save manipulation of data could be done.
exports.saveData = function (store, data, something)
{
  log("Saving aircraft data.");

  store.saveAircraft(data);
}
