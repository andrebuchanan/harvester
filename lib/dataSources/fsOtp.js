var
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone"),
  es      = require("event-stream"),
  jp      = require("JSONStream"),
  reMap   = require("../mapProcessor"),
  util    = require("util");
var
  log     = util.log;

module.exports.dataType = "fsotp";
module.exports.keyFields = ["fcode", "udc"];
module.exports.cache = false;

// This module has no pre-process requirements.
module.exports.preProcess = function(url)
{

};

// The process function is a through stream. It is designed to accept
// a json string consisting of an object with many keys, each value of
// which is an array containing aircraft state data.
module.exports.process = function(url)
{
  return es.pipeline(
    // Parse all elements of the flightStatuses array.
    jp.parse("flightStatuses.*"),
    // Process fleet flight record and extract data relevant to otp.
    es.mapSync(function(flightRecord)
    {
      // Get scheduled and actual departure times.
      var schedBlocksOff = flightRecord.operationalTimes.scheduledGateDeparture;
      var actBlocksOff = flightRecord.operationalTimes.actualGateDeparture;
      // If both values are good, keep this flight.
      if (schedBlocksOff !== undefined && actBlocksOff !== undefined)
      {
        var
          otpRecord = {},
          sched = moment.utc(schedBlocksOff.dateUtc),
          act = moment.utc(actBlocksOff.dateUtc);

        otpRecord[CTI.fullFlightCode] = flightRecord.carrierFsCode + flightRecord.flightNumber;
        otpRecord[CTI.updateDate] = sched.format("YYYY-MM-DD");
        otpRecord[CTI.airlineCode] = url.vars.fleet;
        otpRecord[CTI.schedGateTime] = Math.floor(sched.valueOf() / 1000);
        otpRecord[CTI.actualGateTime] = Math.floor(act.valueOf() / 1000);

        // Put this transformed record into the output stream.
        return otpRecord;
      }
    })
  );
};

// Save data. I think we might make each data source responsible for figuring
// how / if it saves data.
// However, each data source may expect an array of database stores to be
// passed to it. Each store should have the same API.
// If no saving of data is to take place, simply return a through stream.
// return es.through();
module.exports.save = function()
{
  // Turn arguments into an array.
  var dbs = Array.prototype.slice.call(arguments, 0);
  // Return a through stream. Must return the data in original condition.
  return es.mapSync(function(data)
  {
    dbs.forEach(function(store)
    {
      store.saveOtp(data);
    });
    return data;
  });
};
