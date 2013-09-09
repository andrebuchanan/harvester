// Deps.
var
  express = require("express"),
  util    = require("util"),
  moment  = require("moment-timezone"),
  store   = require("./awsStore");
var
  log     = util.log;

// Create http service.
// Configure / set up http service.
var http = express().
  use(express.bodyParser()).
  use(express.logger("dev")).
  use(express.compress()).
  use(express.static("./testclient/", { maxAge: 1 })).
  use(express.cookieParser("jcVi/8mXd4VE4Cu90qCyCznXpVo")).
  use(express.session({ secret: "8mXd4VE4Cu90qCyCznXpVo", key: "harvester.sess", cookie: { path: "/", httpOnly: true, maxAge: null }}));

//
// Export the http server. The calling module can be responsible for starting it up as needed.
module.exports = http;

//
// Get defined route params.
function getRouteParams(routeParams)
{
  var params = {};
  for (param in routeParams)
  {
    if (routeParams[param] !== undefined) params[param] = routeParams[param];
  }
  return params;
}

//
// FIDS data retrieval.
http.get("/fids/date/:date/:destination?", function(req, res)
{
  log("/fids/date/:date/:destination?");
  store.getFIDS(getRouteParams(req.params), function(error, data)
  {
    log("response from STORE received: " + error + " : " + data);
    res.json(200, data);
  });
});

//
// FIDS by fleet.
http.get("/fids/fleet/:fleet/:gate?", function(req, res)
{
  log("/fids/fleet/:fleet");
  store.getFIDS(getRouteParams(req.params), function(error, data)
  {
    log("response from STORE received: " + error + " : " + data);
    res.json(200, data);
  });
});

//
// FIDS by flight.
http.get("/fids/flight/:flight", function(req, res)
{
  log("/fids/flight/:flight");
  store.getFIDS(getRouteParams(req.params), function(error, data)
  {
    log("response from STORE received: " + error + " : " + data);
    res.json(200, data);
  });
});

//
// Route parameter validation.

// Validate date inputs.
http.param("date", function(req, res, next, date)
{
  // If date is valid, process request.
  if(moment(date, "YYYY-MM-DD").isValid())
  {
    next();
  }
  // Otherwise return 400 class error.
  else {
    res.json(400, {
      "error": "Invalid date supplied, please use YYYY-MM-DD"
    });
  }
});

// Validate gate inputs.
http.param("gate", function(req, res, next, gate)
{
  // Gate is one of two forms.
  gate === "gate" ? gate : "nogate";
  req.params.gate = gate;

  next();
});
