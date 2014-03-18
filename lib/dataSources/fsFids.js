// Deps
var
  CTI     = require("./ctiMap").CTI,
  moment  = require("moment-timezone"),
  es      = require("event-stream"),
  jp      = require("JSONStream"),
  reMap   = require("../mapProcessor"),
  util    = require("util");
var
  log     = util.log;

// Define a data map for flight stats FIDS data. This maps FS fields to common CTI
// field names.
var dMap = require("./fsFidsMap").map;

module.exports.dataType = "fsfids";
module.exports.keyFields = ["fcode", "trans"];
module.exports.cache = true;

// This module has no pre-process requirements.
module.exports.preProcess = function(url)
{

};

// The process function is a through stream. It is designed to accept
// a json string consisting of an object with many keys, each value of
// which is an array containing aircraft state data.
module.exports.process = function(url)
{
  return es.pipeline(
    // Parse all elements of the fidsData array.
    jp.parse("fidsData.*"),
    // Add portcode and transition to the record.
    es.mapSync(function(fidsRecord)
    {
      fidsRecord.portCode = url.vars.portCode;
      fidsRecord.transition = url.vars.transition;
      return fidsRecord;
    }),
    // Rename fields.
    reMap(dMap)
  );
};

// Save data. I think we might make each data source responsible for figuring
// how / if it saves data.
// However, each data source may expect an array of database stores to be
// passed to it. Each store should have the same API.
// If no saving of data is to take place, simply return a through stream.
// return es.through();
module.exports.save = function()
{
  // Turn arguments into an array.
  var dbs = Array.prototype.slice.call(arguments, 0);
  // Return a through stream. Must return the data in original condition.
  return es.mapSync(function(data)
  {
    dbs.forEach(function(store)
    {
      store.saveFids(data);
    });
    return data;
  });
};
