// Deps.
var
  util            = require("util"),
  WebSocketServer = require("ws").Server,
  WebSocket       = require("ws").WebSocket,
  redis           = require("./redisConn"),
  request         = require("./requestHandler"),
  jf              = require("json-filter");
var
  log       = util.log;

// Utilise the cache to get data.
var _client = redis.createClient();

//
// Socket initialisation / configuration / setup.
module.exports.listen = function(server)
{
  var wss = new WebSocketServer({server: server});
  wss.on("connection", function(socket)
  {
    log("ws connection");
    socket.on("message", function(message)
    {
      log("ws message " + message + "received");
      var req;
      // Parse request message.
      try
      {
        req = JSON.parse(message);
      }
      catch(e)
      {
        log(e);
        socket.close(400, "Invalid JSON format");
        return;
      }

      // Need to test whether or not parse was successful. Do error stuff.
      log("ws message is: " + util.inspect(req));

      // Send response to requester.
      preHandleRequest(socket, req);
    });
  });
};

//
// Use a socket to send data (string for the moment) to client.
function socketSend(socket, data)
{
  // Send only if socket is ready to receive. I think 1 is good.
  if (socket.readyState === 1)
  {
    // Attempt to parse the response object into a string.
    var error = false;
    var sendString = "";
    try { sendString = JSON.stringify(data); }
    catch (e) { error = "Unable to parse response: " + e; }

    // No error state. Send response.
    if (!error)
    {
      socket.send(sendString);
      return;
    }
    // Otherwise the fan has been thrown into a brown and stinky pit of poo.
    socket.send(JSON.stringify({ "error": error}));
  }
  // Nothing is sent in event of socket not being ready.
}

//
// Use a connected socket to send a response to the connected client.
function preHandleRequest(socket, req)
{
  request.handle(req, function(error, response)
  {
    socketSend(socket, response);
  });

  // If the request included a subscribe parameter, the requester would like
  // to have new / updated data pushed to it.
  if (req.subscribe)
  {
    // Create a subscribe client and subscribe to messages related to the requested
    // dataType.
    var sclient = redis.createClient();
    log ("subbing to " + req.dataType);
    sclient.SUBSCRIBE(req.dataType);

    sclient.on("message", function(channel, key)
    {
      // Get the key from the server and prepare an update message.
      _client.GET(key, function(getError, value)
      {
        // Do not proceed if there was an error getting the cached value.
        if (getError)
        {
          log("Get error: " + getError)
          return;
        }

        // Send string to client.
        var response = req;
        var item = JSON.parse(value);
        response.items = [item];

        // XXX
        // Here we want to test the item against the supplied query parameters. If item does not
        // match, do not send it.
        var filter = {};
        for (var queryParam in req.query)
        {
          filter[queryParam] = { $only: [req.query[queryParam]]};
        }
        var test = jf(item, filter);

        if (test) socketSend(socket, response);
      });
    });

    // When the socket closes (client disconnect, etc), do not try to send updates.
    socket.on("close", function()
    {
      log("socket closed, ending subscription and updates.");
      sclient.end();
    });
  }
};
