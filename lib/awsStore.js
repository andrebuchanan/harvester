var AWS = require("aws-sdk");

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
  console.log("sending aircraft to AWS", object);
  dynDb.putItem({
    "TableName": "aircraft",
    "Item": object
  }, function(error, data)
  {
    console.log("response from AWS", error ? error : data);
  });
}

// Save aircraft position.
exports.savePosition = function(object)
{
  console.log("sending position to AWS", object);
  var req = dynDb.putItem({
    "TableName": "positions",
    "Item": object
  }, function(error, data)
  {
    console.log("response from AWS", error ? error : data);
  });
}
