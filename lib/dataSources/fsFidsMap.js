var CTI = require("./ctiMap").CTI;
// This map tells the processor how to get a particular value from the
// fields it will encounter in the source data. Default behaviour is to
// get value from source and put in structure under mapped name. More
// complex functionality can be specified by using functions.
exports.map = [
  // Example 1, value for CTI field on left is to be taken from data source field on right:
  // { CTI.flightId: "flightId" ]
  // Example 2, value for CTI field on left is to be taken from function on right:
  // { CTI.flightId: function(recordData) { return recordData.thatField * 10; ] ]

  [ CTI.flightId,           "flightId" ],
  [ CTI.flightNum,          "flight" ],
  [ CTI.fullFlightCode,     "airlineCode" ],
  [ CTI.airlineCode,        "flightNumber" ],

  [ CTI.updateTime,         "lastUpdatedTimeUtc" ],
  [ CTI.updateDate,         "lastUpdatedDateUtc" ],
  [ CTI.dayOffset,          "dayOffset" ],

  [ CTI.opFlightNum,        "operatedFlightNumber" ],
  [ CTI.opAirlineCode,      "operatingAirlineCode" ],

  [ CTI.originCity,         "originCity" ],
  [ CTI.originCountry,      "originCountryCode" ],
  [ CTI.originAirportCode,  function(data)
    {
      return "XXX";
    }
  ],

  [ CTI.destCity,           "destinationCity" ],
  [ CTI.destCountry,        "destinationCountryCode" ],
  [ CTI.destAirportCode,    function(data)
    {
      return "XXX";
    }
  ],

  [ CTI.delayed,            "delayed" ],
  [ CTI.remarks,            "remarks" ],
  [ CTI.remarksTime,        "remarksWithTime" ],
  [ CTI.remarksCode,        "remarksCode" ],

  [ CTI.schedTime,          "scheduledTime" ],
  [ CTI.currTime,           "currentTime" ],
  [ CTI.actualTime,         "actualTime" ],
  [ CTI.estTime,            "estimatedTime" ],
  [ CTI.schedGateTime,      "scheduledGateTime" ],
  [ CTI.currGateTime,       "currentGateTime" ],
  [ CTI.actualGateTime,     "actualGateTime" ],
  [ CTI.estGateTime,        "estimatedGateTime" ],

  [ CTI.gate,               "gate" ],
  [ CTI.terminal,           "terminal" ],

  [ CTI.codeShare,          "isCodeshare" ],
  [ CTI.codeShares,         "codesharesAsCodes" ],

  [ CTI.weatherSummary,     "weather" ],
  [ CTI.weatherC,           "temperatureC" ],
  [ CTI.weatherF,           "temperatureF" ]
];
