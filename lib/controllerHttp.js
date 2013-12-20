// Deps.
var
  express = require("express"),
  util    = require("util"),
  redis   = require("redis"),
  moment  = require("moment-timezone");
var
  log     = util.log;

var
  log     = util.log;

// Redis client for publishing url status changes.
var pclient = redis.createClient();

// Grab secret from environment variable.
var hashSecret = process.env.CONTROLLER_SECRET;
// Error if there is no secret.
if (!hashSecret)
  throw "ERROR: No secret key found in env variable CONTROLLER_SECRET.";

// Create http service.
// Configure / set up http service.
var http = express().
  use(express.bodyParser()).
  use(express.logger("dev")).
  use(express.compress()).
  use(express.static("./controller/")).
  use(express.cookieParser(hashSecret)).
  use(express.session({ secret: hashSecret, key: "controller.sess", cookie: { path: "/", httpOnly: true, maxAge: null }}));

//
// Export the http server. The calling module can be responsible for starting it up as needed.
module.exports = http;

http.use(function(req, res, next)
{
  log(req);
  next();
});

//
// Get urls.
http.get("/url/:id?", function(req, res)
{
  res.json(200, [{ id: 1, name: "urlname", status: true, description: "a url" }]);
});

// Update a url
http.post("/url", function(req, res)
{
  pclient.PUBLISH("control:url", "url:" + req.body.id);
  res.json(200, req.body);
});

