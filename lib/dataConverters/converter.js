var
  util    = require("util"),
  CTI     = require("../dataSources/ctiMap").CTI,
  moment  = require("moment-timezone");
var
  log     = util.log;

// XXX Qantas' definition of overtime is 15 minutes (900 seconds)
var OVERTIME = 900;

exports.convertOTP = function(data)
{
  var flights = data.Items.sort(function(a,b)
  {
    if (a[CTI.schedGateTime] < b[CTI.schedGateTime]) return -1;
    if (a[CTI.schedGateTime] > b[CTI.schedGateTime]) return 1;
    return 0;
  });

  var newData = {}, flightCount = 0, overtimeCount = 0;
  // Loop over each flight and compare scheduled to actual. Group into hours.
  flights.forEach(function(flight)
  {
    newData.fleet = flight[CTI.airlineCode];
    newData.date = flight[CTI.updateDate];
    // Get the flight hour so we can we can group stats by hours.
    var flightHour = moment.unix(flight[CTI.schedGateTime]).hour();

    // Adjust total counter.
    flightCount += 1;

    log(flight[CTI.fullFlightCode] + ", " + flight[CTI.actualGateTime] + ", " + flight[CTI.schedGateTime] + ", " + (flight[CTI.actualGateTime] - flight[CTI.schedGateTime]));
    // Is flight overtime?
    if (flight[CTI.actualGateTime] - flight[CTI.schedGateTime] >= OVERTIME)
    {
      overtimeCount += 1;
    }

    // Group by hours.
    newData[flightHour] = Math.round(100 - (overtimeCount / flightCount * 100));
  });

  return newData;
}