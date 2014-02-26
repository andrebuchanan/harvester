// Deps
var
  request = require("request"),
  util    = require("util");
var
  log     = util.log;

var urlParser;
// A function to set the url parser.
exports.setUrlParser = setUrlParser;
function setUrlParser(parser)
{
  urlParser = parser;
}

// Collect data from web service providers.
exports.collect = collect;
function collect(reqOptions, urls, runCheckCb, responseCb, harvesterCb)
{
  // Test to see whether this request should run or not.
  if (!runCheckCb()) return false;

  // If a callback wasn't supplied, use a default noop.
  if (!responseCb) responseCb = function() { };
  if (!harvesterCb) harvesterCb = function(error, data) { log(error); log(data); };

  // Iterate over urls, request data from each.
  urls.forEach(function(url)
  {
    if (!url.enabled) return false;

    var parsedUrl = url.url;
    // If there is a parser
    if (urlParser) parsedUrl = urlParser(url.url);

    // If the cacheBust option is true, add random query string to url.
    if (url.cacheBust)
    {
      var joiner = parsedUrl.indexOf('?') === -1 ? '?' : '&';
      parsedUrl += joiner + 'cb=' + Date.now();
    }

    reqOptions.url = parsedUrl;
    // Make a request for data.
    var req = request(reqOptions, function(error, res, body)
    {
      // Check for errors.
      if (error)
      {
        harvesterCb(error, body);
        return;
      }
      // Response code is not what we want.
      if (!(res.statusCode === 200 || res.statusCode === 304))
      {
        error = error ? error : "Data source responded with status code " + res.statusCode;
        harvesterCb(error, body);
        return;
      }

      // Check that body is not undefined. If it is, bail out immediately.
      if (body === undefined)
      {
        error = error ? error : "No content received.";
        harvesterCb(error, body);
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
