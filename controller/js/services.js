(function()
{
"use strict";

angular.module('hcontroller.services', ["firebase"]).
  factory("Url", function($firebase)
  {
    var Url = $resource("/url/:id", {}, {});
    return Url;
  });
})();
