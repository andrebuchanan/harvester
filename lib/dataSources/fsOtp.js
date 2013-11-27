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
  if (!(url.url && url.fleet)) throw "OTP url definition not complete.";
});

// Check length of urls array. If no elements, throw error.
if (urls.length === 0)
{
  throw "No urls defined for OTP data source.";
}

// Obtain app id and app key from environment.
var
  appId = process.env.FS_FLEET_ID,
  appKey = process.env.FS_FLEET_KEY;
// If these are not present, throw exception.
if (!(appId && appKey))
{
  throw "Cannot use FlightStats data source without FLEET credentials.";
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
    "extendedOptions": "useHttpErrors",
    "utc": true,
    "codeshares": false,
    "numHours": (moment().hour() > 1 ? moment().hour() : 1)
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
    // Needs to run on the hour, every hour.
    // if (lastRun === null)
    // {
    //   lastRun = true;
    //   return true;
    // }

    // If at start of hour or 30 minute mark.
    if (lastRun !== null && Date.now() - lastRun < MINUTE * 5)
    // if ((moment().minutes() === 30 || moment().minutes() === 0) && lastRun !== moment().minutes())
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
    if (!data.flightStatuses)
    {
      var errMsg = error.error = "No flight status data found in response.";
      log(errMsg);
      return false;
    }

    // Add fleet to data.
    data.fleet = url.fleet;
  };

  // Set the requester url parse function.
  requester.setUrlParser(function(url)
  {
    // Grab the current UTC time and use it to build individual date elements.
    var currentTime = moment.utc();
    var year = currentTime.year(), month = currentTime.month() + 1, day = currentTime.date(), hour = currentTime.hour();

    // Substitute these elements into the url.
    var newUrl = url.replace("{y}", year, "g");
    newUrl = newUrl.replace("{m}", month, "g");
    newUrl = newUrl.replace("{d}", day, "g");
    newUrl = newUrl.replace("{h}", hour, "g");

    // Return the parsed url.
    return newUrl;
  });

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
    var flights = [];
    // Iterate over flights.
    input.flightStatuses.forEach(function(flight)
    {
      var schedBlocksOff = flight.operationalTimes.scheduledGateDeparture;
      var actBlocksOff = flight.operationalTimes.actualGateDeparture;
      // If both values are good, keep this flight.
      if (schedBlocksOff !== undefined && actBlocksOff !== undefined)
      {
        var record = {}, sched = moment.utc(schedBlocksOff.dateUtc), act = moment.utc(actBlocksOff.dateUtc);
        //, "YYYY-MM-DDTHH:mm:ss.SSS");

        record[CTI.fullFlightCode] = flight.carrierFsCode + flight.flightNumber;
        record[CTI.updateDate] = sched.format("YYYY-MM-DD");
        record[CTI.airlineCode] = input.fleet;
        record[CTI.schedGateTime] = Math.floor(sched.valueOf() / 1000);
        record[CTI.actualGateTime] = Math.floor(act.valueOf() / 1000);

        log(util.inspect(record));
        // Add to flight record array.
        flights.push(record);
      }
    });

    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", flights);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
}

// Save the data. The intention of this function is to provide a place where flight stats
// specific, pre-save manipulation of data could be done.
exports.saveData = function (store, data, something)
{
  log("Saving otp data.");

  store.saveOtp(data);
}
