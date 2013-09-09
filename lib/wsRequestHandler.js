// Deps.
var
  util      = require("util"),
  sio       = require("socket.io"),
  store     = require("./awsStore");
var
  log       = util.log;

//
// Socket initialisation / configuration / setup.
module.exports.listen = function(server)
{
  var socketio = sio.listen(server, {
    "log level": 0
  });

  socketio.of("/fids").on("connection", function(socket)
  {
    var timer = null;
    // Receiving the fleet event initiates data push.
    socket.on("fleet", function(reqData)
    {
      timer = socketSendFids(reqData, socket);
      console.log("got fleet", reqData);
    });

    // Make sure we don't attempt to send data to a disconnected socket.
    socket.on("disconnect", function()
    {
      console.log("disconnecting.");
      if (timer) clearInterval(timer);
    });
  });
};

// Send fids data over socket every two minutes.
function socketSendFids(reqData, socket)
{
  var send = function()
  {
    store.getFIDS(reqData, function(error, data)
    {
      console.log("sending fids via socket");
      socket.emit("fids", data);
    });
  };
  var timer = setInterval(send, 120000);

  send();
  return timer;
}
