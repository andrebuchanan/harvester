(function()
{
"use strict";

angular.module('hcontroller.controllers', ["firebase"]).
  //
  // App controller. Handle basic functions.
  controller("appCtrl", function()
  {
    this.grock = function(input)
    {

    };
  })
  //
  // Url controller.
  .controller("urlCtrl", function($scope, $firebase)
  {
    var that = this;
    var ref = new Firebase("https://cti-harvester-urls.firebaseio.com/");
    this.urls = $firebase(ref);

    this.updateUrl = function(url)
    {
      this.url.enabled = !this.url.enabled;
      this.urls.$save();
    };
  });
})();
