// Connect to the fids room.
var fids = io.connect("http://localhost:3000/fids?pass=123", {
  "try multiple transports": false
});

fids.on("connect", function()
{
  fids.emit("fleet", { "fleet": "QF" });
  fids.emit("fleet", { "fleet": "QF" });
});

fids.on("fids", function(data)
{
  console.log(data);
  console.log(data);
});
