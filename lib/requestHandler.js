// Deps.
var
  express = require("express"),
  util = require("util");

// Create http service.
// Configure / set up http service.
var http = express().
  use(express.bodyParser()).
  use(express.logger("dev")).
  use(express.compress()).
  use(express.cookieParser("jcVi/8mXd4VE4Cu90qCyCznXpVo")).
  use(express.session({ secret: "8mXd4VE4Cu90qCyCznXpVo", key: "harvester.sess", cookie: { path: "/", httpOnly: true, maxAge: null }}));

// Export the http server. The calling module can be responsible for starting it up as needed.
module.exports = http;

// Testing.
http.get("/test", function(req, res)
{
  console.log("request received");
  res.json({
    test: "ing"
  });
});