// Deps.
var
  util            = require("util"),
  WebSocketServer = require("ws").Server,
  WebSocket       = require("ws").WebSocket,
  redis           = require("redis"),
  request         = require("./requestHandler");
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
      // Parse request message.
      try
      {
        var req = JSON.parse(message);
      }
      catch(e)
      {
        log(e);
        socket.close(400, "Invalid JSON format");
      }

      // Need to test whether or not parse was successful. Do error stuff.
      log("ws message is: " + util.inspect(req));

      // Send response to requester.
      socketSendResponse(socket, req);
    });
  });
};

//
// Use a connected socket to send a response to the connected client.
function socketSendResponse(socket, req)
{
  var send = function()
  {
    request.handle(req, function(error, response)
    {
      // Send only if socket is ready to receive. I think 1 is good.
      if (socket.readyState === 1)
      {
        // Attempt to parse the response object into a string.
        var sendString = "";
        try { sendString = JSON.stringify(response); }
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
    });
  };

  // Send data right away.
  send();

  // If the request included a subscribe parameter, the requester would like
  // to have new / updated data pushed to it.
  if (request.subscribe)
  {
    // Create a subscribe client and subscribe to messages related to the requested
    // dataType.
    var sclient = redis.createClient();
    sclient.SUBSCRIBE(request.dataType);

    sclient.on("message", function(channel, key)
    {
      // Get the key from the server and prepare an update message.
      _client.GET(key, function(error, value)
      {
        // XXX
        // Do proper error thing.
        if (error) return;
        // Send string to client.
        var response = request;
        response.items = [JSON.parse(value)];
        var sendString = JSON.stringify(response);
        // XXX
        // Verify json parsing was good.
        callback(null, sendString);
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
