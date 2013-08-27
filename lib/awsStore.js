var
  AWS     = require("aws-sdk"),
  async   = require("async"),
  util    = require("util");
var
  log     = util.log;

// Set region for CTI account.
AWS.config.update({ region: "us-west-2" });

// Create a service interface instance. New wont create a new db, just interface to service.
var dynDb = new AWS.DynamoDB({
  httpOptions: {
    proxy: process.env.http_proxy
  },
  apiVersion: 'latest',
  sslEnabled: false // Our proxy and / or my machine is doing wierd things.
});

//
// Exports.
exports.saveAircraft = function(object)
{
  log("sending aircraft to AWS", object);
  dynDb.putItem({
    "TableName": "aircraft",
    "Item": object
  }, function(error, data)
  {
    log("response from AWS", error ? error : data);
  });
}

// Save aircraft position.
exports.savePosition = function(object)
{
  log("sending position to AWS", object);
  var req = dynDb.putItem({
    "TableName": "positions",
    "Item": object
  }, function(error, data)
  {
    log("response from AWS", error ? error : data);
  });
}

// Save FIDS data.
exports.saveFIDS = function(data)
{
  var awsData = {
    RequestItems: { "fids": [] }
  };
  var batchCount = 0;
  // Loop over data structure (must be array of FIDS entries). Take standard CTI data
  // and convert to AWS data. Create batches of 25 items.
  while (data.length)
  {
    var item = data.pop();
    var awsItem = {
      PutRequest: {
        Item: {},
      }
    };
    // Iterate over keys, add key, value, type to awsData.
    for (var key in item)
    {
      if (item[key] === undefined) continue;
      awsItem.PutRequest.Item[key] = { "S": item[key] + "" };
    }
    // Add item to AWS array.
    awsData.RequestItems.fids.push(awsItem);
    // Send a batch and reset data array.
    if (data.length === 0 || awsData.RequestItems.fids.length == 25)
    {
      sendFIDSBatch(awsData);
      awsData.RequestItems.fids = [];
    }
  }
}

// Send a batch write operation to AWS. Batches must not exceed 25 items.
function sendFIDSBatch(awsData)
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
      log("Sending FIDS batch, attempt (" + attemptNo + ") to AWS");
      attemptNo++;
      dynDb.batchWriteItem(awsData, function(error, awsResults)
      {
        log("AWS FIDS request returned.");
        // There is an error. Stop processing immediately.
        if (error)
        {
          log("AWS FIDS request errored: " + error);
          sendRequest = false;
          cb();
        }

        // No error. Please continue.
        awsData = awsResults.unprocessedItems;
        // Test the data response. If there are no more unprocessed items,
        // signify that we do not wish to continur makign AWS calls.
        if (!awsResults.unprocessedItems) sendRequest = false;
        // We have finished. call the callback.
        cb();
      });
    },
    // Function to call when repeated execution of main function has ceased.
    function(error)
    {
      log("Stopped sending data to AWS.");
    }
  );
}
