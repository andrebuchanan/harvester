var redis = require("redis");

exports.createClient = function(port, ip, options)
{
  var _options = {
    port: port || null,
    ip: ip || process.env.REDIS_IP || null,
    options: options || null
  };

  return redis.createClient(_options.port, _options.ip, _options.options);
};