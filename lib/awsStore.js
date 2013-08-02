var AWS = require("aws-sdk");

// Set region for CTI account.
AWS.config.update({ region: "us-west-2" });

// Create a service interface instance. New wont create a new db, just interface to service.
var dynDb = new AWS.DynamoDB({
  httpOptions: {
    proxy: process.env.http_proxy
  },
  apiVersion: 'latest',
  sslEnabled: false
});

//
// Exports.
exports.save = function(object)
{
  console.log(object);
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

  req.on("error", function(res)
  {
    console.log("RES", res);
  });
}
