// Deps.
var
  util      = require("util"),
  sio       = require("socket.io"),
  store     = require("./awsStore");
var
  log       = util.log;

//
// Web socket authorization.
function wsAuth(handshake, cb)
{
  var pass = "123";
  cb(null, handshake.query.pass === pass);
}

//
// Socket initialisation / configuration / setup.
module.exports.listen = function(server)
{
  if (!server) throw "wsRequestHandler requires http server.";

  // Start the socket server with configuration options.
  var socketio = sio.listen(server, {
    "log level": 3,                             // Do not log everything.
    "transports": [ "websocket" ],              // Only accept web sockets.
    "destroy upgrade": false,                   // Do not destroy non-socket.io upgrade requests.
    // "browser client": false,
    "match origin protocal": true,
    // "browser client gzip": true,                // Compression.
    // "browser client minification": true,        // Send minified socket.io library.
    "authorization": function(handshake, cb)    // Only allow authorized connections.
    {
      console.log(handshake);
      // wsAuth(handshake, cb);
      cb(null, true);
    }
  });

  socketio.on("anything", function(data)
  {
    console.log("got something", data);
  });

  // Fids namespace.
  socketio.of("/fids").on("connection", function(socket)
  {
    log("got fids connection");
    var timer = null;
    // Receiving the fleet event initiates data push.
    socket.on("fleet", function(reqData)
    {
      timer = socketSendFids(reqData, socket);
      log("got fleet " + reqData);
    });

    // Make sure we don't attempt to send data to a disconnected socket.
    socket.on("disconnect", function()
    {
      log("disconnecting.");
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
      log("sending fids via socket");
      socket.emit("fids", data);
    });
  };
  var timer = setInterval(send, 120000);

  send();
  return timer;
}
