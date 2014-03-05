(function()
{
"use strict";

angular.module('hcontroller.filters', []).
  //
  // url status conversion.
  filter("status", function()
  {
    return function(bool, singular)
    {
      var output = bool ? "enable" : "disable";
      if (!singular) output += "d";
      return output;
    };
  }).
  // Shorten the url
  filter("shorten", function()
  {
    return function(input)
    {
      if (!input) return;
      var idx = input.substring(0, input.indexOf("/", 9)) + "...";
      return idx;
    };
  });
})();
