// Deps
var
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone"),
  es      = require("event-stream"),
  jp      = require("JSONStream"),
  util    = require("util");
var
  log     = util.log;

module.exports.dataType = "track";
module.exports.keyFields = ["fcode"];

// Some aircraft do not transmit flight codes or tail information.
// Use this counter help give them an identity.
var _ufoCounter;

// The process function is a through stream. It is designed to accept
// a json string consisting of an object with many keys, each value of
// which is an array containing aircraft state data.
module.exports.process = function() {
  // Reset counter every time we get data. This helps keeps the number low.
  _ufoCounter = 0;
  return es.pipeline(
    jp.parse("*"),
    es.mapSync(parseFrData)
  );
};

// Parse FlightRadar JSON output for a single aircraft.
function parseFrData(frData)
{
  var aircraft = {};
  aircraft[CTI.modeSId]           = frData[0] || "N/A";
  aircraft[CTI.lat]               = frData[1] || 0;
  aircraft[CTI.lon]               = frData[2] || 0;
  aircraft[CTI.heading]           = frData[3] || 0;
  aircraft[CTI.altitudeFt]        = frData[4] || 0;
  aircraft[CTI.speedKt]           = frData[5] || 0;
  aircraft[CTI.equipment]         = frData[8] || "N/A";
  aircraft[CTI.aircraftTail]      = frData[9] ? frData[9].replace("-", "") : "UFO-" + (++_ufoCounter);
  aircraft[CTI.updateTime]        = frData[10] || moment().utc().unix();
  aircraft[CTI.originAirportCode] = frData[11] || "N/A";
  aircraft[CTI.destAirportCode]   = frData[12] || "N/A";
  aircraft[CTI.fullFlightCode]    = frData[13] || aircraft[CTI.aircraftTail] || "N/A";
  aircraft[CTI.onGround]          = frData[14] || 0;
  aircraft[CTI.vertSpeed]         = frData[15] || 0;
  aircraft[CTI.airlineCode]       = frData[16] ? frData[16].substring(0,3) : "N/A";

  // Check integrity of data and return if all is well.
  if (aircraft[CTI.aircraftTail] &&
    aircraft[CTI.equipment] &&
    aircraft[CTI.fullFlightCode])
  {
    return aircraft;
  }
}
