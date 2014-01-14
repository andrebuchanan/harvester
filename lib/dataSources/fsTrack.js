// Deps
var
  requester = require("./requester.js"),
  Events  = require("events").EventEmitter,
  util    = require("util"),
  fs      = require("fs");
  urlCtrl = require("../urlControl");
  mapProc = require("../mapProcessor");
var
  log     = util.log;

// Report name of data source.
exports.name = "FlightStats Aircraft Track";
exports.dataType = "fstrack";
exports.keyFields = ["fcode"];

// Define a data map for flight stats FIDS data. This maps FS fields to common CTI
// field names.
var dMap = require("./fsTrackMap").map;

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

var MINUTE = 60000; // Milliseconds.
var lastRun = {}; // The last time this store collected data.
exports.runCheck = function(url)
{
  // Collect data every 30 seconds.
  if (lastRun[url] && Date.now() - lastRun[url] < (MINUTE * 0.5))
  {
    return false;
  }
  // This data source was last run at the current time.
  lastRun[url] = Date.now();
  return true;
};

// Collect data from web service providers.
exports.collect = collect;
function collect(url, harvesterCb)
{
  // We use this callback to check the response in context of data source.
  var responseCb = function(error, body)
  {
    // Flight stats do strange erroring? Ah yes, they do, but if you send a special param
    // they can do normal http errors. XXX Investigate this feature later.
    if (body.error) error = body.error;
    // Otherwise execute callback.
    // Another situation in which body data might not be included?!
    if (body && body.flightPositions)
    {
      log("Collected [" + body.flightPositions.length + "] track entries.");
      body.portCode = url.portCode;
    }
    // Log instances where above test fails.
    else
    {
      log("WARNING. Did not collect data: " + body);
      if (!body.error) error = "Body contains no data.";
    }
  };

  // Use the default requester to obtain a response from the web service.
  return requester.collect(
    reqOptions,
    url.url,
    responseCb,
    // This callback is passed through from the harvester.
    harvesterCb
  );
}

// Process FIDS data. Here we use a standard mapProcessor to extract the data we
// need from the flight stats FIDS data structure.
exports.auger = function(input)
{
  // For each record, insert a port code field.
  var recordCb = function(record)
  {
    record.portCode = input.portCode;
  };

  // Process fids data with the map processor.
  return mapProc.processData(input.flightPositions, dMap, null, recordCb);
};

// Save the data. The intention of this function is to provide a place where flight stats
// specific, pre-save manipulation of data could be done.
exports.saveData = function (store, data, something)
{
  log("Saving aircraft position data.");

  var flightNums = {};
  var newData = [];
  // Remove duplicates.
  data.forEach(function(item)
  {
    if (!flightNums[item.fcode]) newData.push(item);
    flightNums[item.fcode] = true;
  });
  store.saveAircraftPositions(newData);
};
