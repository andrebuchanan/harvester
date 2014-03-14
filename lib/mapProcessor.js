// Deps
var
  es      = require("event-stream"),
  util    = require("util");
var
  log     = util.log;

module.exports = reMap;
function reMap(recordMap)
{
  return es.mapSync(function(record)
  {
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
          fieldValue = fieldMap[1].call(null, record);
        }
        // Or raw value?
        else
        {
          fieldValue = record[fieldMap[1]];
        }

        // Warning on undefined value.
        if (fieldValue !== undefined)
        {
          // Apply formating functions, if present.
          fieldMap.slice(2).forEach(function(fmt)
          {
            if (typeof fmt === "function") fieldValue = fmt.call(null, fieldValue);
          });
        }

        // All done.
        mappedRecord[fieldMap[0]] = fieldValue;
      }
      catch(e)
      {
        log(e);
      }
    });
    return mappedRecord;
  });
}
