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
  .controller("urlCtrl", function($scope, $firebase, $modal, $location, $routeParams)
  {
    var that = this;

    // Create a firebase reference.
    var ref = new Firebase("https://cti-harvester-urls.firebaseio.com/");
    this.urls = $firebase(ref);

    if ($routeParams.urlId)
    {
      var uRef = new Firebase("https://cti-harvester-urls.firebaseio.com/" + $routeParams.urlId);
      this.url = $firebase(uRef);
    }

    // Redirect to url view.
    this.viewUrl = function()
    {
      $location.path("/url/" + this.url.id);
    };

    // Flip the enabled flag on a url.
    this.updateUrl = function(url)
    {
      this.url.enabled = !this.url.enabled;
      this.urls.$save();
    };

    // Save a url.
    this.saveUrl = function(url)
    {
      console.log(this.url, url);
    };

    //
    // Open a dialog for display of url information.
    this.urlInfo = function(url)
    {
      $modal.open({
        templateUrl: "partials/url-info-dialog.html",
        resolve: {
          url: function()
          {
            return $scope.urlsCtrl.url;
          }
        },
        controller: "modalInstanceCtrl as modal"
      });
    };

  })
  //
  // Controller for modal
  .controller("modalInstanceCtrl", function($scope, $modalInstance, url)
  {
    this.url = url;
    this.close = function()
    {
      $modalInstance.close();
    };

    this.saveUrl = function()
    {
      console.log(url);
      this.close();
    };
  });
})();
