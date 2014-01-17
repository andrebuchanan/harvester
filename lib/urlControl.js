var redis = require("./redisConn");

var sclient = redis.createClient();
var pclient = redis.createClient();
sclient.SUBSCRIBE("control:url");

// Alter the state of a url when a control message comes through.
sclient.on("message", function(channel, urlKey)
{
  console.log("status changed for url " + urlKey);
  urls[urlKey].enabled = !urls[urlKey].enabled;
  pclient.SADD("urls", "url:" + urlKey);
  pclient.SET("url:" + urlKey, JSON.stringify(urls[urlKey]));
});

var urls = {};
// Add a Url to the store.
exports.addUrl = function(urlObj)
{
  urls[urlObj.id] = urlObj;
  var urlKey = "url:" + urlObj.id;
  pclient.SADD("urls", urlKey);
  pclient.SET(urlKey, JSON.stringify(urlObj));
}