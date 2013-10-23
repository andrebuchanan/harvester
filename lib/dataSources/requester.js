// Deps
var
  request = require("request"),
  util    = require("util");
var
  log     = util.log;

var lastRun = null; // The last time this store collected data.
// Collect data from web service providers.
exports.collect = collect;
function collect(reqOptions, urls, runCheckCb, responseCb, harvesterCb)
{
  // Test to see whether this request should run or not.
  if (!runCheckCb()) return false;

  // If a callback wasn't supplied, use a default noop.
  if (!responseCb) responseCb = function(error, data) { log(error); log(data); };
  if (!harvesterCb) harvesterCb = function(error, data) { log(error); log(data); };

  // Iterate over urls, request data from each.
  urls.forEach(function(url)
  {
    // Make a request for data.
    reqOptions.url = url.url;
    request(reqOptions, function(error, res, body)
    {
      log(url.url);
      // Check that body is not undefined. If it is, bail out immediately.
      if (body === undefined)
      {
        error = error ? error : "No content received.";
        callback(error, body);
        return;
      }

      // Pass the response body to the responseCb for context specific checks.
      responseCb(url, error, body);

      // Pass the response body to the harvesterCb for future processing.
      harvesterCb(error, body);
    });
  });

  // Return true to indicate that this data store was run.
  return true;
}
