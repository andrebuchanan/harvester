// Deps.
var
  util            = require("util"),
  WebSocketServer = require("ws").Server,
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
      log("ws message " + message + ", sending json");
      socketSendFids({ fleet: "QF" }, function(error, data)
      {
        // data.Items.forEach(function(item)
        // {
        //   log("flight " + item.fcode + " has terminal " + item.term + " and gate " + item.gate);
        // });
        var sendString = JSON.stringify(data);
        socket.send(sendString);
      });
    });
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