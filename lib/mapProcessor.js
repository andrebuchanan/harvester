// Deps
var
  Events  = require("events").EventEmitter,
  util    = require("util");
var
  log     = util.log;

var defaultCb = function(input) { return input; };
// Process field-map data. The processed data is made available via an onComplete callback.
// Expect records to be an array of objects where properties are field names and property value is
// field value.
//
// Accepts two callbacks: fieldCallback to be executed on each field (name and value supplied),
// and recordCallback to be executed on each record at end of field processing.
exports.processData = function(records, recordMap, fieldCallback, recordCallback)
{
  // Make sure callbacks are functions.
  fieldCallback = (typeof fieldCallback === "function" ? fieldCallback : defaultCb);
  recordCallback = (typeof recordCallback === "function" ? recordCallback : defaultCb);

  // Set up event emitter for the processing task.
  var processor = new Events();
  var output = [];

  // Begin processing.
  process.nextTick(function()
  {
    if (!records) processor.emit("error", "no records found");
    // Iterate over the record array.
    records.forEach(function(record)
    {
      recordCallback(record);

      var mappedRecord = {};
      // Iterate over the data map and get a value for each field.
      recordMap.forEach(function(fieldMap)
      {
        var fieldValue = null;
        // Record level exception handling means we don't abandon the whole set.
        try
        {
          // How do we get the value from the data source? By function?
          if (typeof fieldMap[1] === "function")
          {
            fieldValue = fieldMap[1].apply(null, [record]);
          }
          // Or raw value?
          else
          {
            fieldValue = record[fieldMap[1]];
          }

          // Warning on undefined value.
          if (fieldValue === undefined)
          {
            processor.emit("warning", "Value for " + fieldMap[0] + " is " + fieldValue, mappedRecord);
          }
          else
          {
            // Apply formating functions, if present.
            fieldMap.slice(2).forEach(function(fmt)
            {
              if (typeof fmt === "function") fieldValue = fmt.apply(null, [fieldValue]);
            });
          }

          fieldCallback(fieldValue);

          // All done.
          mappedRecord[fieldMap[0]] = fieldValue;
        }
        catch(e)
        {
          processor.emit("error", e);
        }
      });
      // Add processed data to array.
      if (mappedRecord) output.push(mappedRecord);
    });
    // If we get here, the loop finished iterating over structure without error.
    processor.emit("complete", output);
  });

  // Return the emitter so the consumer can handle important processsing events.
  return processor;
}
