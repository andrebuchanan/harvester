// Deps.
var
  util            = require("util"),
  WebSocketServer = require("ws").Server,
  WebSocket       = require("ws").WebSocket,
  redis           = require("redis"),
  converter       = require("./dataConverters/converter"),
  store           = require("./awsStore");
var
  log       = util.log;

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
        var request = JSON.parse(message);
      }
      catch(e)
      {
        log(e);
        socket.close(400, "Invalid JSON format");
      }

      // Need to test whether or not parse was successful. Do error stuff.
      log("ws message is: " + util.inspect(request));

      // Send response to requester.
      socketSendResponse(socket, request);
    });
  });
};

//
// Use a connected socket to send a response to the connected client.
function socketSendResponse(socket, request)
{
  // Define data getter and response conversion.
  var handle = {
    "fids":       { get: store.getFIDS },
    "positions":  { get: store.getPositions },
    "aircraft":   { get: store.getAircraft },
    "otp":        { get: store.getOTP, convert: converter.convertOTP }
  };

  // Check that the data type is available to us.
  if (!handle[request.dataType])
  {
    socket.close(400, "Invalid dataType");
    return;
  }

  var handler = handle[request.dataType];
  // This will send the actual data to the requesting socket.
  var send = function()
  {
    request.query = request.query || {};
    // Use the handle to get the requested data.
    handler.get(request.query, function(error, data)
    {
      var response = request;

      // If there is a converter, convert the data.
      if (handler.convert) data = handler.convert(data);

      response.items = data.Items;
      // Only send data if the socket is open.
      log("socket readyState " + socket.readyState);
      // if (socket.readyState === WebSocket.OPEN)
      // {
        var sendString = JSON.stringify(response);
        socket.send(sendString);
      // }
    });
  };
  // Send new data right away and every two minutes.
  send();
  // var timer = setInterval(send, 120000);
  var timer = null;

  // When the socket closes (client disconnect, etc), stop the periodic send.
  socket.on("close", function()
  {
    if (timer) clearTimeout(timer);
    log("socket closed");
  });

  if (request.subscribe)
  {
    var sclient = redis.createClient(), client = redis.createClient();
    sclient.SUBSCRIBE("fids");
    sclient.on("message", function(channel, key)
    {
      // Get the key from the server and send to websocket client.
      client.GET(key, function(error, value)
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
        socket.send(sendString);
      });
    });

    // If the socket closes, stop doing stuff.
    socket.on("close", function()
    {
      sclient.end();
      client.end();
    });

    // If the redis server stops, stop doing stuff.
    // client.on("end")

    // XXX Actually that's bullshit. Do proceed. We want the server to send current state
    // to client.
    // Do not proceed
    // return;
  }
};
