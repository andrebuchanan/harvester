// Deps.
var
  util            = require("util"),
  ws              = require("ws");
var
  log       = util.log;

var wsClient = new ws("http://localhost:3000");

wsClient.on("open", function()
{
  wsClient.send(JSON.stringify({
    "dataType": "fids",
    "query": {
      "fleet": "CX"
    }
  }));
});

wsClient.on("message", function(data, flags)
{
  log("client got message " + data);
  wsClient.close();
});
