// Deps.
var
  util            = require("util"),
  converter       = require("./dataConverters/converter"),
  store           = require("./awsStore");
var
  log             = util.log;

//
// Send the request in the right direction. Function takes request object
// and callback to fire when request has been handled. callback has two
// args, error and response data. If error is not null, there was a problem.
exports.handle = function (request, callback)
{
  // Define data getter and response conversion.
  var handle = {
    "fids":       { get: store.getFIDS },
    "positions":  { get: store.getPositions },
    "track":      { get: store.getPositions },
    "aircraft":   { get: store.getAircraft },
    "otp":        { get: store.getOTP, convert: converter.convertOTP },
    "weather":    { get: store.getImage }
  };

  // Check that the data type is valid.
  if (!handle[request.dataType])
  {
    callback("Invalid dataType", null);
    return;
  }

  // Get handler function.
  var handler = handle[request.dataType];

  // If there is no query object, create an empty one.
  request.query = request.query || {};
  // Use the handle to get the requested data.
  handler.get(request.query, function(error, data)
  {
    var response = request;

    // If there is a converter, convert the data.
    if (handler.convert) data = handler.convert(data);

    // XXX .Items needs to be changed to something which doesn't imply
    // XXX a collection - still hacky. Refactor further back.
    // Provide the response to the callback with no error.
    if (data.Items)
    {
      response.items = data.Items;
      callback(null, response);
    }
    else
    {
      callback(null, data);
    }

  });
};
