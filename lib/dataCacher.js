// Deps
var
  util    = require("util"),
  async   = require("async"),
  redis   = require("./redisConn"),
  client  = redis.createClient();
var
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

// The idea here is an array of objects is supplied and the fields within each object
// that form the key is given.
exports.cacheData = function(category, dataArray, keyFields)
{
  // Don't do anything if cache is not ready.
  if (!_cacheReady) return false;

  var itemCount = dataArray.length;
  var diffCount = 0;
  // This is gunna blow your MIND! This will parallel process 50 elements in
  // the array at a time and execute a callback when all are done. Sweet baby Jesus!
  // I've set a rate limit so that we are not parallel processing 1000s of elements
  // at a time.
  async.eachLimit(dataArray, 50, function(item, itemIsDoneCb)
  {
    // Create the key.
    var key = [category];
    keyFields.forEach(function(fieldName)
    {
      if (item[fieldName]) key.push(item[fieldName]);
    });
    // If the key comprises only the category, do not cache this item as something
    // has gone dreadfully wrong somewhere, possibly, approximately, a little bit.
    if (key.length === 1)
    {
      itemIsDoneCb("Cannot guarantee key uniqueness");
      return;
    }
    key = key.join(":");

    // Get the key from the cache.
    client.GET(key, function(getError, getreply)
    {
      // Serialise the item to be cached.
      var values = JSON.stringify(item);

      if (getError) log ("Get error: " + error);
      // If values are different, replace cache version with new version.
      if (values.indexOf(getreply) === -1)
      {
        diffCount += 1;
        client.SET(key, values, function(setError, setreply)
        {
          if (setError) log ("Cache error: " + error);
          // Publish message with key of changed value.
          client.PUBLISH(category, key, function(pubError, clients)
          {
            if (pubError) log ("Pub error: " + error);
            // And we are finally done.
            itemIsDoneCb(null);
          });
        });
      }
      // The values are not different. Finished with this item.
      else
      {
        itemIsDoneCb(null);
      }
    });
  });
};