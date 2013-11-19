// Deps
var
  storage = require("./awsStore"),
  dataSources = require("./dataSources").sources;
  util = require("util");
var
  log = util.log;

// Get a nice representation of data store name.
function getDsName(ds)
{
  return "Data Store [" + ds.name + "]";
}

// Begin harvesting data.
var threshingRpm; // Threshing timeout.
exports.thresh = function (options)
{
  var
    // Default threshing interval to 10 seconds if not provided.
    interval = options.threshInt || (10000);

  log("Threshing drum is spooling up. Prepare to be harvested, internet!");
  // Rotate the threshing drum at the specified rpm.
  threshingRpm = setInterval(threshingDrum, interval, [options]);
}

// Collect data from web service providers.
function threshingDrum(options)
{
  log("Threshing drum rotates.");

  // Do threshing. Fire off a bunch of requests for data.
  // Data stores are expected to have a
  // standard implementation. They should not be blocking. Does not
  // have to execute every threshing cycle, ie, can operate to its
  // own schedule;
  dataSources.forEach(function(ds)
  {
    log("Checking " + getDsName(ds));

    // Catch all data collection exception handler.
    try {
      // Data store needs a collect interface. Expects a callback to run
      // after data is acquired from source.
      var status = ds.collect(function(error, data)
      {
        // Collector experienced an error.
        if (error)
        {
          log(getDsName(ds) + " could not collect data.");
          console.dir(data);
          console.dir(error);
          return;
        }

        // Do not process if there is no data.
        if (!data)
        {
          log("No data found. Cannot process.");
          return;
        }

        // Beyond this point we assume collection was successful.
        log(getDsName(ds) + " finished collecting data, now processing.");
        // Attempt to remap data source fields to common names.
        var processor = ds.auger(data);

        // On completion, save data. Processing has finished with or without warnings. No
        // errors were encountered.
        processor.on("complete", function(data)
        {
          log(getDsName(ds) + " finsihed processing data.");
          // Data store needs a saveData interface. Callback is optional.
          ds.saveData(storage, data, null);
        });

        // On warning, earmark the data. Note, processing will still continue. This callback
        // provides us with an opportunity to perform some action upon suspect data.
        processor.on("warning", function(warning, data)
        {
          // log(getDsName(ds) + " processor WARNING: " + warning);
          data.warn = true;
        });

        // Report error status. Processing will stop at this point.
        processor.on("error", function(error, data)
        {
          log(getDsName(ds) + " processor ERROR: " + error);
        });
      });
    }
    catch (e)
    {
      log(getDsName(ds) + " caused exception " + e);
    }

    // Report status of data store.
    log(getDsName(ds) + (status ? " running." : " not running yet."));
  });
}

// Stop threshing. Intentionally, this will simply prevent future threshing from
// taking place. It will not stop the grain conveyor. WTF is the grain conveyer?!
exports.stopThresher = function()
{
  if (threshingRpm) clearInterval(threshingRpm);
}
