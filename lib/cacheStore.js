// Deps.
var
  redis   = require("./redisConn"),
  moment  = require("moment-timezone"),
  util    = require("util");
var
  log     = util.log;

// Utilise the cache to get data.
var _client = redis.createClient();

//
// Get an aws filter.
function getFilter(params)
{
  var paramMap = {
    // Flight update date.
    "date": {
      name: "udc",
      props: {
        "AttributeValueList": [
          { "S": params.date }
        ],
        "ComparisonOperator": "EQ"
      }
    },
    // Schedulted date time within a range.
    "flightDate": {
      name: "shgtm",
      props: {
        "AttributeValueList": [
          { "S": (params.flightDate ? params.flightDate[0] : null) },
          { "S": (params.flightDate ? params.flightDate[1] : null) }
        ],
        "ComparisonOperator": "BETWEEN"
      }
    },
    // Gate is assigned / not assigned.
    "gate": {
      name: "gate",
      props: {
        "ComparisonOperator": (params.gate === "gate" ? "NOT_NULL" : "NULL")
      }
    },
    // Fleet
    "fleet": {
      name: "airln",
      props: {
        "AttributeValueList": [
          { "S": params.fleet }
        ],
        "ComparisonOperator": "EQ"
      }
    },
    // Fleet-like
    "fleets": {
      name: "airln",
      props: {
        "AttributeValueList": [
          { "S": params.fleets }
        ],
        "ComparisonOperator": "BEGINS_WITH"
      }
    },
    // Tail
    "tail": {
      name: "tail",
      props: {
        "AttributeValueList": [
          { "S": params.tail }
        ],
        "ComparisonOperator": "EQ"
      }
    },
    // Equipment
    "equipment": {
      name: "equip",
      props: {
        "AttributeValueList": [
          { "S": params.equipment }
        ],
        "ComparisonOperator": "BEGINS_WITH"
      }
    },
    // Port of interest
    "portCode": {
      name: "pcode",
      props: {
        "AttributeValueList": [
          { "S": params.portCode }
        ],
        "ComparisonOperator": "EQ"
      }
    },
    // Destination port
    "destination": {
      name: "dport",
      props: {
        "AttributeValueList": [
          { "S": params.destination }
        ],
        "ComparisonOperator": "EQ"
      }
    },
    // Flight code
    "flight": {
      name: "fcode",
      props: {
        "AttributeValueList": [
          { "S": params.flight }
        ],
        "ComparisonOperator": "BEGINS_WITH"
      }
    }
  };

  var awsFilter = {
    // "gate": {
    //   "ComparisonOperator": "NOT_NULL"
    // }
  };
  // Build the AWS query params from the passed in params.
  for (param in params) {
    log(util.inspect(param));
    awsFilter[paramMap[param].name] = paramMap[param].props;
  }

  return awsFilter;
}

//
// Wrapper function for getting items via table scan.
function getItems(table, params, cb)
{
  var awsFilter = getFilter(params);

  log("requesting data from table " + table);
  // Get entries based on params.
  dynDb.scan({
    "TableName": table,
    "Select": "ALL_ATTRIBUTES",
    "ScanFilter": awsFilter
  },
  function(error, data)
  {
    if (data)
    {
      log("Items returned: " + data.Count);
      data.Items = deStupify(data.Items);
    }
    cb(error, data);
  });
}

//
// This is the data retrieval API.

//
// Get FIDS data for a particular date.
exports.getFIDS = function(params, cb)
{
  getItems(tables.FIDS, params, cb);
}
//
// Get FIDS data for a particular date.
exports.getPositions = function(params, cb)
{
  getItems(tables.POSITIONS, params, cb);
}
//
// Get data for an aircraft.
exports.getAircraft = function(params, cb)
{
  getItems(tables.AIRCRAFT, params, cb);
}
//
// Get raw data for OTP calculation and return results.
exports.getOTP = function(params, cb)
{
  // Default to current date.
  params.date = params.date || moment().format("YYYY-MM-DD");

  // Create a range.
  var lower = Math.floor(moment(params.date).hour(0).minute(0).utc().valueOf() / 1000);
  var upper = Math.floor(moment(params.date).hour(23).minute(59).utc().valueOf() / 1000);
  log(params.date + ", " + lower + ", " + upper);

  // Remove the date parameter.
  delete params.date;
  // Add a new parameter.
  params.flightDate = [lower + "", upper + ""];

  getItems(tables.OTP, params, cb);
}