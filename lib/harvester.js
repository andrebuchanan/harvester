// Deps
var
  request = require("request"),
  storage = require("./awsStore");
//  Test data.
// var
//   testData = require("../flightStats.json");

// Begin harvesting data.
exports.thresh = thresh;

var reqOptions = {
  method: "GET",
  proxy: process.env.http_proxy,
  // url: "http://cassiopeia:3000/test",
  url: "https://api.flightstats.com/flex/flightstatus/rest/v2/json/fleet/tracks/QF",
  qs: {
    appId:"76df9325",
    appKey:"dcc5190b13f0476ce3ecb52045e04f4e",
    includeFlightPlan:"true",
    maxPositions:"2",
    codeshares:"true",
    maxFlights:"20"
  },
  headers: {
    Host: "api.flightstats.com"
    // Host: "cassiopeia:3000"
  },
  json: true
};

var thresher; // Threshing timeout.
// Collect data from web service providers.
function thresh(interval)
{
  // Default threshing interval to 5 minutes if not provided.
  interval = interval || (5 * 60000);
  console.log("Threshing");

  // Do threshing. Fire off a bunch of requests for data.
  // Make a request for data.
  request(reqOptions, function(error, res, body)
  {
    // XXX
    // Basic error catch.
    if (error) console.log(res);

    var data = body;
    // Loop over flight tracks.
    data.flightTracks.forEach(function(item)
    {
      console.log("Aircraft", item.tailNumber);
      if (!item.tailNumber) return false;
      // Save aircraft.
      storage.saveAircraft({
        "aircraftId": { "S": item.tailNumber },
        "fleet": { "S": item.carrierFsCode },
        "equipment": { "S": item.equipment }
      });
      // Loop over positions and store each.
      item.positions.forEach(function(position)
      {
        storage.savePosition({
          "aircraftId": { "S": item.tailNumber },
          "dateTime": { "S": position.date },
          "lat": { "N": (position.lat || 0) + "" },
          "lon": { "N": (position.lon || 0) + "" },
          "dir": { "N": (item.heading || 0) + "" },
          "mph": { "N": (position.speedMph || 0) + "" }
        });
      });
    });
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
