
(function()
{
"use strict";

var app = angular.module("hcontroller", ["ngRoute", "ui.bootstrap", "hcontroller.filters", "hcontroller.services", "hcontroller.directives", "hcontroller.controllers"]).
    config(["$routeProvider", function($routeProvider)
    {
      $routeProvider.when("/",
        { templateUrl: "partials/urls.html", controller: "urlCtrl as urlsCtrl" });
      $routeProvider.when("/url/:urlId",
        { templateUrl: "partials/url.html", controller: "urlCtrl as urlsCtrl" });
     $routeProvider.otherwise({ redirectTo: "/" });
    }]);

app.run(function($rootScope, $log)
{
  $rootScope.$log = null;
});

})();
