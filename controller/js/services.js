(function()
{
"use strict";

angular.module('hcontroller.services', ["ngResource"]).
  factory("Url", function($resource)
  {
    var Url = $resource("/url/:id", {}, {});
    return Url;
  });
})();
