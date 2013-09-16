// Connect to the fids room.
var fids = io.connect("http://localhost:3000/fids");

fids.on("connect", function()
{
  fids.emit("fleet", { "fleet": "QF" });
});

fids.on("fids", function(data)
{
  console.log(data);
});