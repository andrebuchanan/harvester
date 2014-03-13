// Define the common CTI field names.
exports.CTI = {
  // Flight status
  "transition":        "trans", // Transition type, ie, arrival or departure (ARR or DEP)
  "flightId":          "fid",   // "flightId
  "fullFlightCode":    "fcode", // "flight
  "airlineCode":       "airln", // "airlineCode
  "flightNum":         "flnum", // "flightNumber
  "updateTime":        "utc",   // "lastUpdatedTimeUtc
  "updateDate":        "udc",   // "lastUpdatedDateUtc
  "dayOffset":         "dayof", // "dayOffset
  "opFlightNum":       "opnum", // "operatedFlightNumber
  "opAirlineCode":     "opair", // "operatingAirlineCode
  "portCode":          "pcode", // portCode is the airport code where data came from.
  "originCity":        "ocity", // "originCity
  "originCountry":     "ocont", // "originCountryCode
  "originAirportName": "oname", // origin airport name
  "originAirportCode": "oport", // origin port code
  "destCity":          "dcity", // "destCity
  "destCountry":       "dcont", // "destCountryCode
  "destAirportName":   "dname", // destination airport name
  "destAirportCode":   "dport", // destination port code
  "delayed":           "delay", // "delayed
  "remarks":           "rem",   // "remarks
  "remarksTime":       "remtm", // "remarksWithTime
  "remarksCode":       "remco", // "remarksCode
  "schedTime":         "shdtm", // "scheduledTime
  "currTime":          "curtm", // "currentTime
  "estTime":           "esttm", // estimated time
  "actualTime":        "acttm", // scheduled time
  "schedGateTime":     "shgtm", // "scheduledGateTime
  "currGateTime":      "cugtm", // "currentGateTime
  "estGateTime":       "esgtm", // estimated gate time
  "actualGateTime":    "acgtm", // actual gate time
  "schedDate":         "shddt", // "scheduledDate
  "currDate":          "curdt", // "currentDate
  "estDate":           "estdt", // estimated date
  "actualDate":        "actdt", // actual date
  "schedGateDate":     "shgdt", // "scheduledGateDate
  "currGateDate":      "cugdt", // "currentGateDate
  "estGateDate":       "esgdt", // estimated gate date
  "actualGateDate":    "acgdt", // actual gate date
  "gate":              "gate",  // "gate
  "terminal":          "term",  // "terminal
  "codeShare":         "iscod", // "isCodeshare
  "codeShares":        "codes", // Code shares array
  "weatherSummary":    "wsu",   // "weather
  "weatherC":          "wtc",   // "temperatureC
  "weatherF":          "wtf",   // "temperatureF
  // Aircraft data
  "modeSId":           "modesid", // unsure
  "speedMph":          "spdmph",  // ground speed mph
  "speedKt":           "spdkt",   // ground speed knots
  "speedKph":          "spdkph",  // ground speed kph
  "vertSpeed":         "vspd",    // vertical speed feet per minute (-/+)
  "altitudeFt":        "altft",   // altitude above sea level in feet
  "altitudeM":         "altm",    // same in meters
  "lat":               "lat",     // latitude
  "lon":               "lon",     // longitude
  "positionUtc":       "posutc",  // epoch, utc, time position was updated
  "aircraftTail":      "tail",    // aircraft rego
  "heading":           "dir" ,    // heading 0-360
  "equipment":         "equip",   // aircraft type etc
  "onGround":          "ground"   // 0 = flying 1 = on ground
};
