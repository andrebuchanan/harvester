// Deps
var
  requester = require("./requester.js"),
  Events  = require("events").EventEmitter,
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone"),
  es      = require("event-stream"),
  Stream  = require("stream").Stream,
  jp      = require("JSONStream"),
  util    = require("util");
var
  log     = util.log;

var stream = new Stream();
stream.readable = false;
stream.writable = true;

module.exports.process = function() {
  return es.pipeline(
    jp.parse("*"),
    es.mapSync(function(item)
    {
      //console.log("**** item: %s", item)
    })
  );
};

/*
// Report name of data source.
exports.name = "FlightRadar24 Aircraft Info";
<<<<<<< HEAD
exports.dataType = "track";
exports.keyFields = ["fcode"];

// Other stuff.
var MINUTE = 60000; // Milliseconds.
var HOUR = MINUTE * 60; // Milliseconds.

=======
exports.dataType = "fraircraft";
exports.keyFields = ["tail", "fcode"];

>>>>>>> 33b703ae74cb9a02404b44334efc89e444484ab2
// Generic request options.
var reqOptions = {
  method: "GET",
  proxy: (process.env ? process.env.http_proxy : null),
  url: null, // Updated in the requester
  headers: {
    Host: "www.flightradar24.com"
  },
  json: false
};

var MINUTE = 60000; // Milliseconds.
var HOUR = MINUTE * 60; // Milliseconds.
var lastRun = {}; // The last time this store collected data.
exports.runCheck = function(url)
{
  // Collect data every hour.
  if (lastRun[url] && Date.now() - lastRun[url] < HOUR)
  {
    return false;
  }
  // This data source was last run at the current time.
  lastRun[url] = Date.now();
  return true;
};

// Collect data from web service providers.
exports.collect = function(url, harvesterCb)
{
  // Use the default requester to obtain a response from the web service.
  return requester.collect(
    reqOptions,
    url.url,
    // No checking callback is required.
    undefined,
    // This callback is passed through from the harvester.
    harvesterCb
  );
};

// Process aircraft data.
exports.auger = function(input)
{
  var processor = new Events();
  var parsedInput = {};
  var aircrafts = [];
  var flightCodes = {};
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
    for (var item in parsedInput)
    {
      var ary = parsedInput[item];
      // Aircraft items are arrays. Only process those.
      if (typeof ary === "object" && Array.isArray(ary))
      {
        aircraft = {};
        aircraft[CTI.modeSId]         = ary[0] || "empty";
        aircraft[CTI.lat]             = ary[1] || 0;
        aircraft[CTI.lon]             = ary[2] || 0;
        aircraft[CTI.heading]         = ary[3] || 0;
        aircraft[CTI.altitudeFt]      = ary[4] || 0;
        aircraft[CTI.speedKt]         = ary[5] || 0;
        aircraft[CTI.equipment]       = ary[8] || "empty";
        aircraft[CTI.aircraftTail]    = ary[9].replace("-", ""); // This is a primary key. Should be proper rego.
        aircraft[CTI.updateTime]      = ary[10] || moment().utc().unix();
        aircraft[CTI.originAirportCode] = ary[11] || "empty";
        aircraft[CTI.destAirportCode] = ary[12] || "empty";
        aircraft[CTI.fullFlightCode]  = ary[13]; // This is a range key. Must be proper flight code.
        aircraft[CTI.onGround]        = ary[14] || 0;
        aircraft[CTI.vertSpeed]       = ary[15] || 0;
        aircraft[CTI.airlineCode]     = ary[16].substring(0,3);

        // Check integrity of data and add to array if all is well.
        if (aircraft[CTI.aircraftTail].length > 1 &&
          aircraft[CTI.equipment].length > 1 &&
          aircraft[CTI.fullFlightCode].length > 1 &&
          flightCodes[ary[13]] === undefined)
        {
          flightCodes[ary[13]] = true;
          aircrafts.push(aircraft);
        }
      }
    }
    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", aircrafts);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
};

// Save the data. The intention of this function is to provide a place where flight stats
// specific, pre-save manipulation of data could be done.
exports.saveData = function (store, data, something)
{
  // Non deep copy.
  // var data2 = data.slice(0);
  // store.saveAircraft(data);
  // store.saveAircraftPositions(data2);
};

<<<<<<< HEAD
*/
