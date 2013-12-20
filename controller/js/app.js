
(function()
{
"use strict";

var app = angular.module("hcontroller", ["ngRoute", "ui.bootstrap", "hcontroller.filters", "hcontroller.services", "hcontroller.directives", "hcontroller.controllers"]).
    config(["$routeProvider", function($routeProvider)
    {
      $routeProvider.when("/",
        { templateUrl: "partials/urls.html", controller: "urlCtrl as urlsCtrl" });
      // $routeProvider.when("/events/edit/:eventId",
      //                                     { templateUrl: "partials/event.html",   controller: "eventsCtrl",
      //   resolve: { getAuth: authCheck, getAuthz: authzCheck } });
      $routeProvider.otherwise({ redirectTo: "/" });
    }]);

app.run(function($rootScope, $log)
{
  $rootScope.$log = null;
});

})();
