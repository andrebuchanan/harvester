// Deps
var
  request = require("request"),
  Events = require("events").EventEmitter;

//  Test data.
// var
//   testData = require("../flightStats.json");

// Define a data map for flight stats FIDS data. This maps FS fields to common CTI
// field names.
var dMap = require("./fsFidsMap").map;

// Report name of data source.
exports.name = "FlightStats FIDS";

// More than one url?! No worries, use array.
var urls = [
  "https://api.flightstats.com/flex/fids/rest/v1/json/MEL/departures",
  "https://api.flightstats.com/flex/fids/rest/v1/json/MEL/arrivals"
];

// Define standard request parameters.
var reqOptions = {
  method: "GET",
  proxy: process.env.http_proxy,
  // url: "http://cassiopeia:3000/test",
  url: null,
  qs: {
    appId:"76df9325",
    appKey:"dcc5190b13f0476ce3ecb52045e04f4e",
    requstedFields: "airlineCode,flightNumber,city,currentTime,gate,terminal,remarks,lastUpdatedTimeUtc,lastUpdateDateUtc",
    timeFormat: "24",
    excludeCargoOnlyFlights: "true"
  },
  headers: {
    Host: "api.flightstats.com"
    // Host: "cassiopeia:3000"
  },
  json: true
};

var lastRun = null; // The last time this store collected data.
// Collect data from web service providers.
exports.collect = collect;
function collect(callback)
{
  // This data store will run every minute or right away if it hasn't run before.
  if (lastRun !== null && Date.now() - lastRun < 60000)
  {
    return false;
  }
  // This data source was last run at the current time.
  lastRun = Date.now();

  // If a callback wasn't supplied, use a default noop.
  if (!callback) callback = function(error, data) { console.log(error, data); };

  // Iterate over urls, request data from each.
  urls.forEach(function(url)
  {
    // Make a request for data.
    request(reqOptions, function(error, res, body)
    {
      callback(error, body);
    });
  });

  // Return true to indicate that this data store was run.
  return true;
}

// XXX Generalise this.
// Process FIDS data. The processed data is made available via an onComplete callback.
function process(input)
{
  // Set up event emitter for the processing task.
  var processor = new Events();
  var output = [];

  // Begin processing.
  process.nextTick(function()
  {
    // Iterate over the FS FIDS data structure.
    input.fidsData.forEach(function(fids)
    {
      var fidsData = {};
      // Iterate over the data map and get a value for each field.
      dMap.forEach(function(fieldMap)
      {
        var fieldValue = null;
        try {
          // How do we get the value from the data source? By function?
          if (typeof fieldMap[1] === "function")
          {
            fieldValue = fieldMap[1].apply(null, [fids]);
          }
          // Or raw value?
          else
          {
            fieldValue = fids[fieldMap[1]];
          }
          // All done.
          fidsData[fieldMap[0]] = fieldValue;
        }
        catch (e)
        {
          processor.emit("warning", e);
        }
      });
      // Add processed data to array.
      if (fidsData) output.push(fidsData);
    });
    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", output);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
}
