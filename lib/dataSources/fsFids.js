// Deps
var
  request = require("request"),
  Events  = require("events").EventEmitter,
  util    = require("util"),
  fs      = require("fs");
var
  log     = util.log;

// Other stuff.
var MINUTE = 60000; // Milliseconds.

//  Test data.
// var
//   testData = require("../../FIDS_response_most_fields.json");

// Define a data map for flight stats FIDS data. This maps FS fields to common CTI
// field names.
var dMap = require("./fsFidsMap").map;

// Report name of data source.
exports.name = "FlightStats FIDS";

// More than one url?! No worries, use array.
var urls = [
  { portCode: "MEL", url: "https://api.flightstats.com/flex/fids/rest/v1/json/MEL/departures" },
  { portCode: "MEL", url: "https://api.flightstats.com/flex/fids/rest/v1/json/MEL/arrivals" }
];

// Obtain app id and app key from environment.
var
  appId = process.env.FS_APP_ID,
  appKey = process.env.FS_APP_KEY;
// If these are not present, throw exception.
if (!(appId && appKey))
{
  throw "Cannot use FlightStats data source without credentials.";
}

// Define fields of interest.
var fsFields = [
  "flightId",                 // Numeric flight ID. This can be used to look up more detailed flight information via the Flight Status by Flight API.  430791
  "lastUpdatedTimeUtc",          // Date that this flight information was last updated, according to the selected airport's timezone. 01/30/2013
  "lastUpdatedDateUtc",       // Date that this flight information was last updated, in UTC. 01/31/2013
  "dayOffset",                // Nonnegative integer representing the number of days forward from today (according to the selected airport's time zone). For today's flights, this will be 0.  0
  "statusCode",               // Single-character FlightStats code for the status of the flight  A
  "airlineName",              // Name of the airline. For wet leases, this will be the marketing airline rather than the operating airline.  British Airways
  "airlineCode",              // Airline code of the airline. For wet leases, this will be the code for the marketing airline rather than the operating airline. BA
  "flightNumber",             // Flight number assigned by the airline.  100
  "isCodeshare",              // Boolean value indicating whether the flight is a codeshare (flight marketed by multiple airlines).  true
  "operatedFlightNumber",     // Flight number assigned by the operating airline.  200
  "operatingAirlineName",     // Name of the operating airline.  British Airways
  "operatingAirlineCode",     // Code of the operating airline.  BA
  "destinationAirportName",   // Name of the flight's destination airport. Portland International Airport
  "destinationAirportCode",   // Code of the flight's destination airport. PDX
  "destinationCity",          // Name of the flight's destination city.  Portland
  "destinationFamiliarName",  // A name for the destination that the travelers expect, particularly used to distinguish between cities with the same name or multiple airports that serve the same city. New York JFK
  "destinationStateCode",     // State (or province, where applicable) code of the destination airport.  OR
  "destinationCountryCode",   // Country code of the flight's destination airport. us
  "flight",                   // The combination of the airline code and the flight number.  AA 100
  "delayed",                  // Boolean value indicating whether the flight is delayed. true
  "remarks",                  // A phrase with additional information about the status of the flight, including delay information (in minutes) if appropriate. Arrived 30 minutes late
  "remarksWithTime",          // A phrase with additional information about the status of the flight, including local time if appropriate. Arrived 04:27
  "remarksCode",              // One of a small fixed set of strings describing the kind of remark appearing in the remarks field. See Remarks Codes. This field can be requested even if the request does not actually include the remarks field. ARRIVED_LATE
  "airportCode",              // Code for the destination (for departing flights) or origin (for arrivals) airport.  LHR
  "airportName",              // Name of the destination (for departing flights) or origin (for arrivals) airport. London Heathrow
  "city",                     // Name of the destination (for departing flights) or origin (for arrivals) city.  London
  "gate",                     // Name of the gate where the flight will depart/arrive. C12
  "terminal",                 // Name of the terminal where the flight will depart/arrive. C
  "scheduledTime",            // The scheduled arrival or departure time, depending on whether you asked for arrivals or departures. 01:30
  "estimatedTime",            // The estimated arrival or departure time, depending on whether you asked for arrivals or departures. 01:34
  "actualTime",               // The actual arrival or departure time, depending on whether you asked for arrivals or departures.  01:33
  "currentTime",              // The most accurate arrival or departure time (priority: 1. actual 2. estimated 3 scheduled), depending on whether you asked for arrivals or departures.  01:33
  "scheduledGateTime",        // The scheduled gate arrival or departure time, depending on whether you asked for arrivals or departures.  07:40
  "estimatedGateTime",        // The estimated gate arrival or departure time, depending on whether you asked for arrivals or departures.  07:50
  "actualGateTime",           // The actual gate arrival or departure time, depending on whether you asked for arrivals or departures. 08:05
  "currentGateTime",          // The most accurate gate arrival or departure time, depending on whether you asked for arrivals or departures.  08:05
  "codesharesAsCodes",        // If this flight is marketed by multiple carriers, this field lists those codeshare flights with the airline code and flight number.   ["UA 6416","NH 7328","AC 4030"]
  "uplineAirportCodes",       // The codes of the airports, in order, from the flight segments preceding this segment. ["DFW","ATL"]
  "downlineAirportCodes",     // The codes of the airports, in order, from the flight segments after segment.  ["SEA","YVR"]
  "weather",                  // A short description of the weather conditions at the remote airport.  Cloudy
  "temperatureC",             // Air temperature, in degrees Celsius/centigrade, at the remote airport.  0
  "temperatureF"              // Air temperature, in degrees Fahrenheit, at the remote airport.  0
];

// Define standard request parameters.
var reqOptions = {
  method: "GET",
  proxy: (process.env ? process.env.http_proxy : null),
  // url: "http://cassiopeia:3000/test",
  url: null,
  qs: {
    "appId": appId,
    "appKey": appKey,
    "requestedFields": fsFields.join(","),
    "timeFormat": "24",
    "excludeCargoOnlyFlights": true,
    // "maxFlights": 1,
    "includeCodeshares": false
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
  if (lastRun !== null && Date.now() - lastRun < (2 * MINUTE))
  {
    return false;
  }
  // This data source was last run at the current time.
  lastRun = Date.now();

  // If a callback wasn't supplied, use a default noop.
  if (!callback) callback = function(error, data) { log(error, data); };

  // Iterate over urls, request data from each.
  urls.forEach(function(url)
  {
    // Make a request for data.
    reqOptions.url = url.url;
    request(reqOptions, function(error, res, body)
    {
      // Check that body is not undefined. If it is, bail out immediately.
      if (body === undefined)
      {
        error = error ? error : "No content received.";
        callback(error, body);
        return;
      }

      // Flight stats do strange erroring? Ah yes, they do, but if you send a special param
      // they can do normal http errors. XXX Investigate this feature later.
      if (body.error) error = body.error;
      // Otherwise execute callback.
      log(url.url);
      body.portCode = url.portCode;
      callback(error, body);
    });
  });

  // Return true to indicate that this data store was run.
  return true;
}

// XXX Generalise this.
// Process FIDS data. The processed data is made available via an onComplete callback.
exports.auger = auger;
function auger(input)
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
      // Augment fids data with portcode.
      fids.portCode = input.portCode;

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

          // Warning on undefined value.
          if (fieldValue === undefined)
          {
            processor.emit("warning", "Value for " + fieldMap[0] + " is " + fieldValue, fidsData);
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

// Save the data.
exports.saveData = saveData;
function saveData(store, data, something)
{
  log("Saving data.");
  store.saveFIDS(data);
}
