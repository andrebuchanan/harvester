// Deps
var
  request = require("request"),
  util    = require("util"),
  moment  = require("moment-timezone");
var
  log     = util.log;

var urlParser = function(inputUrl)
{
  // Grab the current UTC time and use it to build individual date elements.
  var currentTime = moment.utc();
  var year = currentTime.year(), month = currentTime.month() + 1, day = currentTime.date(), hour = currentTime.hour();

  // Substitute these elements into the url.
  var newUrl = inputUrl.replace("{y}", year, "g");
  newUrl = newUrl.replace("{m}", month, "g");
  newUrl = newUrl.replace("{d}", day, "g");
  newUrl = newUrl.replace("{h}", hour, "g");

  if (newUrl !== inputUrl) log("New URL: " + newUrl);
  // Return the parsed url.
  return newUrl;
};

// Collect data from web service providers.
exports.collect = function(reqOptions, url, responseCb, harvesterCb)
{
  // If a callback wasn't supplied, use a default noop.
  if (!responseCb) responseCb = function() { };
  if (!harvesterCb) harvesterCb = function(error, data) { log(error); log(data); };

  var parsedUrl = url;
  // If there is a parser
  if (urlParser) parsedUrl = urlParser(url);

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
    responseCb(error, body);

    // Pass the response body to the harvesterCb for future processing.
    harvesterCb(error, body);
  });

  // Return true to indicate that this data store was run.
  return true;
}
