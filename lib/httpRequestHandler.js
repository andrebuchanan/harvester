// Deps.
var
  express = require("express"),
  util    = require("util"),
  moment  = require("moment-timezone"),
  request = require("./requestHandler");
var
  log     = util.log;

// Create http service.
// Configure / set up http service.
var http = express().
  use(express.bodyParser()).
  use(express.logger("dev")).
  use(express.compress()).
  use(express.cookieParser("jcVi/8mXd4VE4Cu90qCyCznXpVo")).
  use(express.session({ secret: "8mXd4VE4Cu90qCyCznXpVo", key: "handler.sess", cookie: { path: "/", httpOnly: true, maxAge: null }}));

//
// Export the http server. The calling module can be responsible for starting it up as needed.
module.exports = http;

http.use(function(req, res, next)
{
  log(req);
  next();
});

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
};

//
// Handle request and response.
function doRequest(req, res)
{
  log(req.url);

  // Grab params from url. dataType is content between first / and second /
  var params = {
    query: getRouteParams(req.params)
  };
  params.dataType = req.url.substring(1, req.url.indexOf("/", 1));

  // Use request handler to deal with request in standard manner.
  request.handle(params, function(error, data)
  {
    if (error)
    {
      res.json(400, error);
      return;
    }
    res.json(200, data);
  });
};

//
// FIDS all.
http.get("/fids", doRequest);
// FIDS by flight.
http.get("/fids/flight/:flight", doRequest);
// FIDS by date
http.get("/fids/date/:date/:destination?", doRequest);
// FIDS by fleet.
http.get("/fids/fleet/:fleet/:gate?", doRequest);
// FIDS by port.
http.get("/fids/port/:portCode/:gate?", doRequest);
// Positions by fleet.
http.get("/positions/fleet/:fleet/:gate?", doRequest);
// Positions all
http.get("/positions", doRequest);
// Positions by fleet.
http.get("/track/fleet/:fleet/:gate?", doRequest);
// Positions all
http.get("/track", doRequest);
// Aircraft data by tail
http.get("/aircraft/tail/:tail", doRequest);
// Aircraft data by equipment
http.get("/aircraft/equip/:equipment", doRequest);
// Aircraft data by flight
http.get("/aircraft/flight/:flight", doRequest);
// OTP by fleet and date.
http.get("/otp/:fleet/:date?", doRequest);

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
