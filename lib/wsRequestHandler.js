// Deps.
var
  util            = require("util"),
  WebSocketServer = require("ws").Server,
  WebSocket       = require("ws").WebSocket,
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
  var handle = {
    "fids":       store.getFIDS,
    "positions":  store.getPositions,
  };

  // Check that the data type is available to us.
  if (!handle[request.dataType])
  {
    socket.close(400, "Invalid dataType");
    return;
  }

  // This will send the actual data to the requesting socket.
  var send = function()
  {
    // Use the handle to get the requested data.
    handle[request.dataType](request.query, function(error, data)
    {
      var response = request;
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
  var timer = setInterval(send, 120000);

  // When the socket closes (client disconnect, etc), stop the periodic send.
  socket.on("close", function()
  {
    if (timer) clearTimeout(timer);
    log("socket closed");
  });
};

// Send fids data over socket every two minutes.
function socketSendFids(reqData, cb)
{
  var send = function()
  {
    store.getFIDS(reqData, function(error, data)
    {
      cb(error, data);
    });
  };
  // var timer = setInterval(send, 120000);

  send();
  // return timer;
}
