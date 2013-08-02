// Deps
var
  request = require("request"),
  storage = require("./awsStore");
//  Test data.
var
  testData = require("../flightStats.json");

// Begin harvesting data.
exports.thresh = thresh;

var reqOptions = {
  method: "GET",
  proxy: process.env.http_proxy,
  url: "http://cassiopeia:3000/test",
  // url: "https://api.flightstats.com/flex/flightstatus/rest/v2/json/fleet/tracks/QF",
  qs: {
    appId:"76df9325",
    appKey:"dcc5190b13f0476ce3ecb52045e04f4e",
    includeFlightPlan:"true",
    maxPositions:"2",
    codeshares:"true",
    maxFlights:"5"
  },
  headers: {
    Host: "cassiopeia:3000"
  },
  json: true
};

var thresher; // Threshing timeout.
// Collect data from web service providers.
function thresh(interval)
{
  // Default threshing interval to 5 minutes if not provided.
  interval = interval || (10000);
  console.log("Threshing");

  // Do threshing. Fire off a bunch of requests for data.
  // Make a request for data.
  request(reqOptions, function(error, res, body)
  {
    console.log("response", body);
    // XXX
    // Basic error catch.
    if (error) console.log(res);

    // Loop over flight tracks.
    testData.flightTracks.forEach(function(item)
    {
      storage.savePosition({
        "aircraftId": { "S": item.tailNumber },
        "dateTime": { "S": item.positions[1].date },
        // "lat": item.positions[1].lat ,
        // "lon": item.positions[1].lon ,
        // "dir": item.heading ,
        // "mph": item.positions[1].speedMph
        "lat": { "N": item.positions[1].lat + "" },
        "lon": { "N": item.positions[1].lon + "" },
        "dir": { "N": item.heading + "" },
        "mph": { "N": item.positions[1].speedMph + "" }
      })
    });

    // Save data.
    storage.save(body);
  });

  // Round we go again.
  thresher = setTimeout(thresh, interval);
}

// Stop threshing. Intentionally, this will simply prevent future threshing from
// taking place. It will not stop the grain conveyor.
exports.stopThresher = function()
{
  if (thresher) clearTimeout(thresher);
}
