// Deps.
var
  AWS     = require("aws-sdk"),
  async   = require("async"),
  moment  = require("moment-timezone"),
  base64Conv = require("base64-arraybuffer"),
  util    = require("util");
var
  log     = util.log;

// Other stuff.
var SECOND = 1000;
// Table names.
var tables = {
  FIDS:      "fids",
  AIRCRAFT:  "aircraft",
  POSITIONS: "positions",
  OTP:       "otp",
};

// Set region for CTI account.
AWS.config.update({ region: "us-west-2" });

// Create a service interface instance. New wont create a new db, just interface to service.
var dynDb = new AWS.DynamoDB({
  httpOptions: {
    proxy: process.env.http_proxy
  },
  apiVersion: 'latest',
  sslEnabled: false // Our proxy and / or my machine is doing weird things.
});

//
// Translate object to AWS format.
function translate(input)
{
  var output = {};
  // Iterate over keys, add key, value, type to awsData.
  if (typeof input === "object")
  {
    for (var key in input)
    {
      if (input[key] === undefined) continue;
      output[key] = { "S": input[key] + "" };
    }
  }
  else
  {
    output = { "S": input + "" };
  }
  return output;
}

//
// Exports.

// I guess these are the data store APIs.
// Save aircraft position.
exports.saveAircraftPositions = function(data)
{
  batchWrite(tables.POSITIONS, data);
};
// Save FIDS data.
exports.saveFids = function(data)
{
  batchWrite(tables.FIDS, data);
};
// Save FIDS data.
exports.saveAircraft = function(data)
{
  batchWrite(tables.AIRCRAFT, data);
};
// Save OTP data.
exports.saveOtp = function(data)
{
  batchWrite(tables.OTP, data);
};
// Save image data into an S3 bucket. At the moment this is specific to weather
// but should serve as a template for a more general approach. Really, you could
// simply use more general names in the passed-in data object.
exports.saveImage = function(data)
{
  var s3 = new AWS.S3();

  s3.putObject({
    ACL: "bucket-owner-full-control",
    Body: data.buffer,
    Bucket: "ctiweatherzone2",
    Key: data.portCode + "_" + data.weather + ".png",
    ContentType: "image/png",
    Metadata: {
      "weather": data.weather,
      "port": data.portCode,
      "utc": Math.floor(moment.utc().valueOf() / 1000) + ""
    }
  },
  function(error, res)
  {
    if (error) log("S3 error: " + error);
    log("S3 write" + res.ETag);
  });
};

//
// Batch write requests.
var tableBucket = {};
exports.batchWrite = batchWrite;
function batchWrite(table, data)
{
  if (!tableBucket[table]) tableBucket[table] = [];

  // After 2 seconds, send a batch; this should pick up stray batches of
  // less than 25 items.
  setTimeout(function()
  {
    if (tableBucket[table].length)
    {
      queueBatch(table, tableBucket[table]);
      tableBucket[table] = [];
    }
  }, SECOND * 2);

  // If on a batch write request the bucket size is 25, queue it right away.
  if (tableBucket[table].length === 25)
  {
    queueBatch(table, tableBucket[table]);
    tableBucket[table] = [];
  }

  var awsItem = {
    PutRequest: {
      Item: {},
    }
  };
  awsItem.PutRequest.Item = translate(data);
  // Add item to AWS array.
  tableBucket[table].push(awsItem);
}

var batches = {};
// Send a batch write operation to AWS. Batches must not exceed 25 items. Provisioning restraints
// require that we limit the amount of data being send to AWS. Don't send a batch closer than 1
// second from the last.
function queueBatch(table, batch)
{
  if (!batches[table]) batches[table] = [];
  batches[table].push({ table: table, batch: batch});
}

// Pop batches off the array and send them every second.
(function()
{
  var sendTableBatch = function(tableBatches)
  {
    var batch = tableBatches.pop();
    if (batch)
    {
      sendBatch(batch);
    }
  };

  // Every 3rd of a second, grab a batch from each table batch.
  setInterval(function()
  {
    for (var tableName in batches)
    {
      sendTableBatch(batches[tableName]);
    }
  }, (SECOND / 3));
})();

// Use the write batch function to send items to AWS dynamoDB.
function sendBatch(batch)
{
  var sendRequest = true;
  var attemptNo = 1;
  // While we want to keep making request, please keep making requests. We use the async
  // library here rather than a straight up while loop. This is necessary because the AWS
  // batchWriteItem is async and would cause an ordinary while loop to make repeated same-requests.
  async.whilst(
    // Test function;
    function()
    {
      return attemptNo < 3 && sendRequest;
    },
    // Function to call each time test function passes. This function will be called
    // until the batchWriteItem callback returns no unprocessed items.
    function(cb)
    {
      attemptNo++;

      // Request parameters.
      var params = {
        ReturnConsumedCapacity: "TOTAL",
        RequestItems: {}
      };
      params.RequestItems[batch.table] = batch.batch;

      dynDb.batchWriteItem(params, function(error, awsResults)
      {
        // There is an error. Stop processing immediately.
        if (error)
        {
          log("AWS batch write request errored: " + error);
          log("Batch contained " + batch.batch.length + " items");
          sendRequest = false; // Remove this line to make multiple attempts.
          cb();
          return;
        }

        // No error. Please continue.
        awsData = awsResults.unprocessedItems;
        // Test the data response. If there are no more unprocessed items,
        // signify that we do not wish to continue making AWS calls.
        if (!awsResults.unprocessedItems) sendRequest = false;
        // We have finished. call the callback.
        cb();
      });
    },
    // Function to call when repeated execution of main function has ceased.
    function(error)
    {
      if (error) log (error);
    }
  );
}

//
// Clean the data coming out of dynamoDB.
function deStupify(input)
{
  input.forEach(function(record)
  {
    for (var field in record)
    {
      record[field] = record[field].S;
    }
  });
  return input;
}

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
    "airln": {
      name: "airln",
      props: {
        "AttributeValueList": [
          { "S": params.airln }
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
    },
    "timezone": null
  };

  var awsFilter = {
    // "gate": {
    //   "ComparisonOperator": "NOT_NULL"
    // }
  };
  // Build the AWS query params from the passed in params.
  for (var param in params) {
    if (paramMap[param])
    {
      log("param: " + util.inspect(param));
      awsFilter[paramMap[param].name] = paramMap[param].props;
    }
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
  }, function(error, data)
  {
    if (data)
    {
      log("Items returned: " + data.Count);
      data.Items = deStupify(data.Items);
    }
    if (error)
    {
      log("AWS returned error: " + error);
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
};
//
// Get FIDS data for a particular date.
exports.getPositions = function(params, cb)
{
  getItems(tables.POSITIONS, params, cb);
};
//
// Get data for an aircraft.
exports.getAircraft = function(params, cb)
{
  getItems(tables.AIRCRAFT, params, cb);
};
//
// Get raw data for OTP calculation and return results.
exports.getOTP = function(params, cb)
{
  // Use timezone if available.
  var timezone = params.timezone || "Australia/Melbourne";
  log("Timezone: " + moment.tz(timezone).zone());

  // Default to current date.
  params.date = params.date || moment.tz(timezone).format("YYYY-MM-DD");

  // Create a range.
  var lower = Math.floor(moment.tz(params.date, timezone).hour(0).minute(0).utc().valueOf() / 1000);
  var upper = Math.floor(moment.tz(params.date, timezone).hour(23).minute(59).utc().valueOf() / 1000);
  log(params.date + ", " + lower + ", " + upper);

  // Remove the date and timezone parameters.
  delete params.date;
  // delete params.timezone;

  // Add a new parameter.
  params.flightDate = [lower + "", upper + ""];

  getItems(tables.OTP, params, cb);
};
//
// Get image data from an S3 bucket.
exports.getImage = function(data, cb)
{
  var s3 = new AWS.S3();

  s3.getObject({
    Bucket: "ctiweatherzone2",
    Key: data.portCode + "_" + data.weather + ".png",
    ResponseContentType: "image/png"
  },
  function(error, res)
  {
    if (error)
    {
      log("S3 error: " + error);
    }
    else
    {
      log("S3 read" + res.Metadata);
      res.Body = base64Conv.encode(res.Body);
    }
    cb(error, res);
  });
};
