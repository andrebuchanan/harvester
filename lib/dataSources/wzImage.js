// Deps
var
  es      = require("event-stream"),
  util    = require("util");
var
  log     = util.log;

module.exports.dataType = "weather-image";
module.exports.cache = false;

// This module has no pre-process requirements.
module.exports.preProcess = function(url)
{

};

// The process function is a through stream. It will accept a number of
// image buffer chunks and
module.exports.process = function(url)
{
  var bufs = [];
  return es.through(
    // When a data chunk (buffer) is written to this through stream,
    // store the buggers in an array.
    function write(data)
    {
      bufs.push(data);
    },
    // When data stops coming into stream, combine buffers and emit
    // data object with concatenated buffer inside.
    function end()
    {
      // Buffer is a global object.
      this.emit("data",
      {
        buffer: Buffer.concat(bufs),
        portCode: url.vars.portCode,
        weather: url.vars.weather
      });
    }
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
      store.saveImage.call(null, data);
    });
    return data;
  });
};
