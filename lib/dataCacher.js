// Deps
var
  es      = require("event-stream"),
  redis   = require("./redisConn"),
  client  = redis.createClient(),
  util    = require("util"),
  log     = util.log;

// XXX - Better error handling please.
client.on("error", function(error)
{
  console.log(error);
});
var _cacheReady = false;
// Set state when client connects.
client.on("connect", function(error)
{
  _cacheReady = true;
});

// Cache each piece of data coming through. If the data is different from an
// existing piece of data with the same key, publish a message.
module.exports.cache = function(category, keyFields)
{
  // Don't do anything if cache is not ready.
  if (!_cacheReady) return false;

  return es.map(function(data, doneCb)
  {
    var cacheKey = makeKey(data, category, keyFields);

    // Add this key to the category set for mass retrieval.
    client.SADD(category, cacheKey);

    doCache(data, category, cacheKey, function()
    {
      // This is a passthrough so we want to ensure data goes out of here
      // no matter what.
      doneCb(null, data);
    });

  });
};

// Cache the item.
function doCache(data, category, cacheKey, doneCb)
{
  // Get the key from the cache.
  client.GET(cacheKey, function(getError, getreply)
  {
    // Serialise the item to be cached.
    var dataString = JSON.stringify(data);

    if (getError) log("Get error: " + error);
    // If values are different, replace cache version with new version.
    if (dataString.indexOf(getreply) === -1)
    {
      client.SET(cacheKey, dataString, function(setError, setreply)
      {
        if (setError) log ("Cache error: " + error);
        // Publish message with key of changed value.
        client.PUBLISH(category, cacheKey, function(pubError, clients)
        {
          if (pubError) log ("Publish error: " + pubError);
          // And we are finally done.
          doneCb();
        });
      });
    }
    // Values are same.
    else
    {
      doneCb();
    }
  });
}

// Generage a key. Moving this here to keep it out of the way of cache code.
function makeKey(data, category, keyFields)
{
  var key = [category];
  keyFields.forEach(function(fieldName)
  {
    if (data[fieldName] !== undefined) key.push(data[fieldName]);
  });

  // XXX
  // This is an error condition, really.
  if (key.length === 1)
  {
    log("Cache key error, too short");
  }
  return key.join(":");
}
