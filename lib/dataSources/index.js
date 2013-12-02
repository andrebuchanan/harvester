var log = require("util").log;

// Define a bunch of data stores from which to acquire data during the
// threshing cycle.
var dataSources = [];
var dataSourcesList = [
  // "./fsFids",
  // "./fsTrack",
  // "./frAircraft",
  // "./fsOtp",
  "./wzImage.js"
];

// Attempt to require the data sources. Log require errors.
dataSourcesList.forEach(function(source)
{
  var sourceName = require.resolve(source);
  // Require the source.
  try {
    var mod = require(source);
    // If we get here, the module didn't throw an exception upon require.
    // Allow it to be used during threshing.
    log("Data source at [" + sourceName + "] loaded.");
    dataSources.push(mod);

  }
  // Require failed. Log error.
  catch(e)
  {
    log("Data source at [" + sourceName + "] could not be loaded: " + e);
  }
});
// Show how many data sources loaded.
log("Data sources loaded: " + dataSources.length);

// Export the data sources.
exports.sources = dataSources;