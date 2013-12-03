// Deps.
var
  util            = require("util"),
  ws              = require("ws");
var
  log       = util.log;

var wsClient = new ws("http://localhost:8888");

wsClient.on("open", function()
{
  wsClient.send(JSON.stringify({
    "dataType": "fids",
    "query": {
      "fleet": "QF",
      "gate": 1
    },
    "subscribe": 1
  }));
});

wsClient.on("message", function(data, flags)
{
  log("client got message of length: " + data.length);
  log("message head: " + data.substr(0, 50));
});
