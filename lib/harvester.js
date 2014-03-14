// Deps
var
  storage     = require("./awsStore"),
  dataSources = require("./dataSources").sources;
  dataCacher  = require("./dataCacher"),
  util        = require("util"),
  urlCtrl     = require("./urlControl"),
  later       = require("later"),
  request     = require("request"),
  es          = require("event-stream"),
  prettyCron  = require("prettycron"),
  Emitter     = require("events").EventEmitter,
  log         = util.log;

// Set up an event emitter which will fire off an event when the thresher
// wants to stop.
var _threshState = new Emitter;
// A place to keep track of url timers created with later.
var _urlTimers = {};
// Threshing timeout.
var _threshingRpm;

// Begin harvesting data.
exports.thresh = function (options)
{
  var
    // Default threshing interval to 10 seconds if not provided.
    interval = options.threshInt || (10000);

  log("Threshing drum is spooling up. Prepare to be harvested, internet!");
  // Rotate the threshing drum at the specified rpm.
  _threshingRpm = setInterval(threshingDrum, interval, [options]);
};

// Watch for stop event and stop all timers.
_threshState.on("stop", function()
{
  for (var urlId in _urlTimers)
  {
    stopUrlTimer(urlId);
  }
  // We can now clear the threshing timer.
  if (_threshingRpm) clearInterval(_threshingRpm);
});

// Stop a url timer.
function stopUrlTimer(urlId)
{
  if (_urlTimers[urlId]) _urlTimers[urlId].clear();
}

// Collect data from web service providers.
function threshingDrum(options)
{
  // Iterate over a list of urls and run the specified data sources over
  // each url.
  urlCtrl.urls.forEach(function(url)
  {
    // Don't use this url if it isn't enabled. Also cancel the timer associated with
    // the url, if there is one.
    if (!url.enabled)
    {
      stopUrlTimer(url.id);
      return;
    }

    if (!_urlTimers[url.id])
    {
      log("Creating schedule for " + url.id);
      log(prettyCron.toString(url.cron, true));
      // Schedule the request to occur according the url's cron
      // definition.
      var schedule = later.parse.cron(url.cron, true);
      var timer = later.setInterval(function()
      {
        requestData(url);
      }, schedule);
      _urlTimers[url.id] = timer;
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
  reqOptions.encoding = url.encoding;
  if (url.json) reqOptions.json = url.json;
  reqOptions.json = false;

  // Pipe the response from the request to each data source.
  var reqStream = request(url.url, reqOptions);
  log("Request made");
  dataSources.forEach(function(dataSrc)
  {
    // Do not use this data source if the url does not want it.
    if (url.dataTypes.indexOf(dataSrc.dataType) === -1) return;

    // data source pre-processing tasks.
    dataSrc.preProcess(url);

    reqStream
      // Use the data source to process the data coming from the request.
      .pipe(dataSrc.process(url))
      // Cache the data coming out of the process stage.
      .pipe(dataCacher.cache(dataSrc.cache, dataSrc.dataType, dataSrc.keyFields))
      // Send data to the data source save mechanism
      .pipe(dataSrc.save(storage));
  });
}
// Stop everything.
exports.stopThresher = function()
{
  _threshState.emit("stop");
};
