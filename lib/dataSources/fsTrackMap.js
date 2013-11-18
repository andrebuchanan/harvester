var
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone");
// This map tells the processor how to get a particular value from the
// fields it will encounter in the source data. Default behaviour is to
// get value from source and put in structure under mapped name. More
// complex functionality can be specified by using functions.

// Third and subsequent elements in field array are formatting functions.

var dateConv = function(input)
{
  return moment(input, "MM/DD/YYYY").format("YYYY-MM-DD");
}
var dateTimeConv = function(input)
{
  return Math.floor(moment().utc(input, "YYYY-MM-DDTHH:mm:ss.SSS").valueOf() / 1000);
}

exports.map = [
  // Example 1, value for CTI field on left is to be taken from data source field on right:
  // { CTI.flightId: "flightId" ]
  // Example 2, value for CTI field on left is to be taken from function on right:
  // { CTI.flightId: function(recordData) { return recordData.thatField * 10; ] ]

  [ CTI.flightId,           "flightId" ],
  [ CTI.portCode,           "portCode" ],
  [ CTI.airlineCode,        function(record)
  {
    return record.callsign.substr(0,3);
  }],
  [ CTI.fullFlightCode,     "callsign" ],
  [ CTI.aircraftTail,       "tailNumber" ],
  [ CTI.heading,            "heading" ],
  [ CTI.lat,                function(record)
  {
    var lastPos = record.positions.length - 1;
    return record.positions[lastPos].lat;
  }],
  [ CTI.lon,                function(record)
  {
    var lastPos = record.positions.length - 1;
    return record.positions[lastPos].lon;
  }],
  [ CTI.speedMph,           function(record)
  {
    var lastPos = record.positions.length - 1;
    return record.positions[lastPos].speedMph;
  }],
  [ CTI.altitudeFt,         function(record)
  {
    var lastPos = record.positions.length - 1;
    return record.positions[lastPos].altitudeFt;
  }],
  [ CTI.positionUtc,       function(record)
  {
    var lastPos = record.positions.length - 1;
    return record.positions[lastPos].date;
  }, dateTimeConv]
];
