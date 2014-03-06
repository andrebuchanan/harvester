// Deps
var
  storage     = require("./awsStore"),
  dataSources = require("./dataSources").sources;
  util        = require("util"),
  urlCtrl     = require("./urlControl"),
  later       = require("later"),
  request     = require("request"),
  es          = require("event-stream"),
  prettyCron  = require("prettycron"),
  log         = util.log;

// XXXperimental
// Include data cacher.
var cacher = require("./dataCacher");

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
};

// A place to keep track of url timers created with later.
var urlTimers = {};
// Collect data from web service providers.
function threshingDrum(options)
{
  // Iterate over a list of urls and run the specified data sources over
  // each url.
  urlCtrl.urls.forEach(function(url)
  {
    if (url.enabled) log("Active: " + url.name);

    // Don't use this url if it isn't enabled. Also cancel the timer associated with
    // the url, if there is one.
    if (!url.enabled)
    {
      if (urlTimers[url.id]) urlTimers[url.id].clear();
      return;
    }

    if (!urlTimers[url.id])
    {
      log("Creating schedule for " + url.id);
      log(prettyCron.toString(url.cron, true));
      // Schedule the request to occur according the url's cron
      // definition.
      var schedule = later.parse.cron(url.cron, true);
      var timer = later.setTimeout(function()
      {
        // Falsify the schedule so that another may be created.
        urlTimers[url.id] = false;
        // Use the url to request data.
        requestData(url);
      }, schedule);
      urlTimers[url.id] = timer;
    }
  });
}

// Use a url to request data.
function requestData(url, cb)
{
  // Generic request options.
  var reqOptions = {
    method: "GET",
    proxy: (process.env ? process.env.http_proxy : null),
    url: url,
  };
  // Add optional components.
  if (url.qs) reqOptions.qs = url.qs;
  if (url.auth) reqOptions.auth = url.auth;
  if (url.encoding) reqOptions.encoding = url.encoding;
  if (url.json) reqOptions.json = url.json;

  // Pipe the response from the request to each data source.
  var reqStream = request(url.url, reqOptions);
  dataSources.forEach(function(ds)
  {
    reqStream.pipe(ds.process());
  });
}

// Process data acquired from a url.
function processResponse(responseError, responseData)
{
  // Do threshing. Fire off a bunch of requests for data.
  // Data stores are expected to have a
  // standard implementation. They should not be blocking. Does not
  // have to execute every threshing cycle, ie, can operate to its
  // own schedule;
  dataSources.forEach(function(ds)
  {
    // Do not run this data source against the url data if the url will
    // not use this data source.
    if (url.dataTypes.indexOf(ds.dataType) === -1) return;

    // Should the data source run?
    if (!ds.runCheck(url.url)) return;

    var status;
    // Catch all data collection exception handler.
    try {
      // Data store needs a collect interface. Expects a callback to run
      // after data is acquired from source.
      status = ds.collect(url, function(error, data)
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

          // Cache the data.
          cacher.cacheData(ds.dataType, data, ds.keyFields);

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

    // If status is good, ds is running - report.
    if (status) log(getDsName(ds) + " running.");
  });
}

// Stop everything.
exports.stopThresher = function()
{
  if (threshingRpm) clearInterval(threshingRpm);
};
