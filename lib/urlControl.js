var
  Firebase = require("firebase"),
  EE = require('events').EventEmitter,
  _urlRef = new Firebase("https://cti-harvester-urls.firebaseio.com/");

// A place to store harvester URLs.
var _urls = [];
var _urlStore = {};

// Url control event emitter for url change notification.
var _ee = new EE();
module.exports.events = _ee;

// Use firebase to get all the urls (and new urls).
_urlRef.on("child_added", function(snapshot)
{
  // Grab the url and add it to in-memory store.
  var url = snapshot.val();
  _urlStore[url.id] = url;
  _urls.push(_urlStore[url.id]);

  // Notify stake-holders.
  _ee.emit("url-added", url.id);
});

// When a url changes, update the in-memory store.
_urlRef.on("child_changed", function(snapshot)
{
  // Grab the url and update in-memory store.
  var url = snapshot.val();
  log("URL changed: " + url.id);
  _urls[findUrlInd(url.id)] = _urlStore[url.id] = url;

  // Notify stake-holders.
  _ee.emit("url-changed", url.id);
});

// When a url is removed, remove it from the in-memory store.
_urlRef.on("child_removed", function(snapshot)
{
  // Grab the url and update in-memory store.
  var url = snapshot.val();
  log("!URL deleted: " + url.id);
  delete _urlStore[url.id];
  delete _urls[findUrlInd(url.id)];
});

// Find a url in the array.
findUrlInd = function(id)
{
  var oldUrl = _urlStore[id];
  return _urls.indexOf(oldUrl);
};

// Return this module's url store to caller.
exports.urls = _urls;
