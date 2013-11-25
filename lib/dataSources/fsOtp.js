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
    "numHours": moment().hour()
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
    if (lastRun !== null && moment().hour() === lastRun)
    {
      return false;
    }
    // This data source was last run at the current time.
    lastRun = moment().hour();
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
    log(input.request.numHours.interpreted + ", " + input.request.hourOfDay.interpreted + ", " + input.request.utc.interpreted);
    var otpData = [];
    input.flightStatuses.forEach(function(flight)
    {
      var schedBlocksOff = flight.operationalTimes.scheduledGateDeparture;
      var actBlocksOff = flight.operationalTimes.actualGateDeparture;
      // Do some time comparison magic.
      var sched = moment.utc(schedBlocksOff.dateLocal, "YYYY-MM-DDTHH:mm:ss.SSS");
      log(sched.hour() + ", " + flight.carrierFsCode + flight.flightNumber + ", " + schedBlocksOff + ", " + actBlocksOff);
      // If both values are good, use them.
      if (schedBlocksOff !== undefined && actBlocksOff !== undefined)
      {

        // Get the hour in which the flight was scheduled.
        var flightHour = sched.hour();
        // Init structure if not already there.
        if (!otpData[flightHour]) otpData[flightHour] = {
          numFlights: 0,
          overFlights: 0,
          red: 0,
          yellow: 0,
          hourOtp: 100
        };

        var hourData = otpData[flightHour];
        // Increase number of flights operating in this hour.
        hourData.numFlights += 1;

        // Get the difference between scheduled and actual in minutes.
        var diff = moment.utc(actBlocksOff.dateLocal, "YYYY-MM-DDTHH:mm:ss.SSS").diff(sched, "minutes");
        // If the difference is 15 minutes or greater, this flight is not on time.
        log(sched.valueOf() + ", " + flightHour + ", " + diff);
        if (diff >= 15)
        {
          hourData.overFlights += 1;
        }
      }
    });

    var finalData = {};
    var numFlights = 0;
    var overFlights = 0;
    // Do a final pass over the the data and fill in the blanks.
    otpData.forEach(function(flightHour, hour)
    {
      numFlights += flightHour.numFlights;
      overFlights += flightHour.overFlights;
      // OTP for hour is 100% minus overtime flights div by num flights mul 100
      finalData[hour] = 100 - (overFlights / numFlights * 100);
      log(hour + ", " + numFlights + ", " + overFlights)
    });
    finalData.airln = "VA"
    finalData.udc = moment.utc().format("YYYY-MM-DD");

    log("final data" + util.inspect(finalData));

    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", finalData);
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
