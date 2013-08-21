// Define the common CTI field names.
exports.CTI = {
// Flight identifiers
  "flightId":          "fid",   // "flightId
  "fullFlightCode":    "fcode", // "flight
  "airlineCode":       "airln", // "airlineCode
  "flightNum":         "flnum", // "flightNumber
  "updateTime":        "utc",   // "lastUpdatedTimeUtc
  "updateDate":        "udc",   // "lastUpdatedDateUtc
  "dayOffset":         "dayof", // "dayOffset
  "opFlightNum":       "opnum", // "operatedFlightNumber
  "opAirlineCode":     "opair", // "operatingAirlineCode
  "originCity":        "ocity", // "originCity
  "originCountry":     "ocont", // "originCountryCode
  "originAirportName": "oname",
  "originAirportCode": "oport",
  "destCity":          "dcity", // "destCity
  "destCountry":       "dcont", // "destCountryCode
  "destAirportName":   "dname",
  "destAirportCode":   "dport",
  "delayed":           "delay", // "delayed
  "remarks":           "rem",   // "remarks
  "remarksTime":       "remtm", // "remarksWithTime
  "remarksCode":       "remco", // "remarksCode
  "schedTime":         "shdtm", // "scheduledTime
  "currTime":          "curtm", // "currentTime
  "estTime":           "esttm",
  "actualTime":        "acttm",
  "schedGateTime":     "shgtm", // "scheduledGateTime
  "currGateTime":      "cugtm", // "currentGateTime
  "estGateTime":       "esgtm",
  "actualGateTime":    "acgtm",
  "gate":              "gate",  // "gate
  "terminal":          "term",  // "terminal
  "codeShare":         "iscod", // "isCodeshare
  "codeShares":        "codes", // Code shares array
  "weatherSummary":    "wsu",   // "weather
  "weatherC":          "wtc",   // "temperatureC
  "weatherF":          "wtf"    // "temperatureF
};
