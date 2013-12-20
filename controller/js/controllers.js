(function()
{
"use strict";

angular.module('hcontroller.controllers', []).
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
  .controller("urlCtrl", function($scope, Url)
  {
    var that = this;
    this.urls = Url.query();

    this.updateUrl = function(url)
    {
      this.url.enabled = !this.url.enabled;
      url.$save();
    }
  });
})();
