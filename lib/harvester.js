// Deps
var
  storage = require("./awsStore");

// Define a bunch of data stores from which to acquire data during the
// threshing cycle.
var dataSources = [
  require("./dataSources/fsFids"),
  require("./dataSources/fsFleetTrack")
];

// Get a nice representation of data store name.
function getDsName(ds)
{
  return "Data Store [" + ds.name + "]";
}

// Begin harvesting data.
exports.thresh = thresh;

var thresher; // Threshing timeout.
// Collect data from web service providers.
function thresh(options)
{
  console.log(".");
  // Default threshing interval to 10 seconds if not provided.
  var interval = options.threshInt || (10000);

  // Do threshing. Fire off a bunch of requests for data.
  // Make a request for data. Data stored are expected to have a
  // standard implementation. They should not be blocking. Does not
  // have to execute every threshing cycle, ie, can operate to its
  // own schedule;
  dataSources.forEach(function(ds)
  {
    // Data store needs a collect interface. Expects a callback to run
    // after data is acquired from source.
    var status = ds.collect(function(error, data)
    {
      // Collector experienced an error.
      if (error)
      {
        console.log(getDsName(ds) + " could not collect data.");
        console.dir(error);
        return;
      }
      // Beyond this point we assume collection was successful.

      // Attempt to remap ds fields to common names.
      var processor = ds.process(data);

      // On completion, save data. Processing has finished with or without warnings. No
      // errors were encountered.
      processor.on("complete", function(data)
      {
        // Data store needs a saveData interface. Callback is optional.
        ds.saveData(storage, data, null);
      });

      // On warning, earmark the data. Note, processing will still continue. This callback
      // provides us with an opportunity to perform some action upon suspect data. Data must
      // be returned?
      processor.on("warning", function(warning, data)
      {
        console.log(getDsName(ds) + " processor WARNING: " + warning);
        data.warn = true;
        return data;
      });

      // Report error status. Processing will stop at this point.
      processor.on("error", function(error, data)
      {
        console.log(getDsName(ds) + " processor ERROR: " + error);
      });
    });

    // Report status of data store.
    if (status)
    {
      console.log(getDsName(ds) + " running.");
    }
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
