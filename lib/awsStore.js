var
  AWS     = require("aws-sdk"),
  async   = require("async"),
  log     = require("util").log;

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
    RequestItems: []
  };
  // Loop over data structure (must be array of FIDS entries). Take standard CTI data
  // and convert to AWS data.
  data.forEach(function(item)
  {
    var awsItem = {
      PutRequest: {
        Item: {},
        TableName: "fids"
      }
    };
    // Iterate over keys, add key, value, type to awsData.
    for (var key in item)
    {
      awsItem.PutRequest.Item[key] = { "S": item[key] + "" };
    }
    // Add item to AWS array.
    awsData.RequestItems.push(awsItem);
  });

  var sendRequest = true;
  // While we want to keep making request, please keep making requests. We use the async
  // library here rather than a straight up while loop. This is necessary because the AWS
  // batchWriteItem is async and would cause an ordinary while loop to make repeated same-requests.
  async.whilst(
    // Test function;
    function()
    {
      return sendRequest;
    },
    // Function to call each time test function passes. This function will be called
    // until the batchWriteItem callback returns no unprocessed items.
    function(cb)
    {
      log("Sending FIDS to AWS");
      dynDb.batchWriteItem(awsData, function(error, awsResults)
      {
        log("response from AWS", error ? error : awsResults);
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
