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
  .controller("urlCtrl", function($scope, $firebase, $modal, $location, $routeParams, $firebaseSimpleLogin)
  {
    var that = this;
    this.urlSaveError = {
      alert: false
    };
    this.urlSearch = {
      $: '',
      deleted: false
    };
    this.edit = {};

    // Create a firebase reference.
    var ref = new Firebase("https://cti-harvester-urls.firebaseio.com/");
    // Authentication.
    this.auth = $firebaseSimpleLogin(ref);
    // Get urls.
    this.urls = $firebase(ref);

    this.authenticate = function(username, password)
    {
      this.auth.$login("password", {
        email: username,
        password: password
      }).then(function(user)
      {
        that.auth.error = false;
      },
      function(error)
      {
        that.auth.error = "Invalid email or password";
      });
    };

    this.addNewUrl = function(urlId)
    {
      // Check that url id isn't already used.
      if (!this.urls[urlId])
      {
        this.urls[urlId] = { id: urlId, enabled: false, name: "New Url", deleted: false };
      }
      this.urls.$save(urlId);
    };

    this.loadUrlData = function(urlId)
    {
      urlId = urlId || $routeParams.urlId || false;
      if (!urlId) return;
      var uRef = new Firebase("https://cti-harvester-urls.firebaseio.com/" + urlId);
      this.url = $firebase(uRef);
      this.edit.unsaved = false;
    };

    if ($routeParams.urlId)
    {
      this.loadUrlData($routeParams.urlId);
    }

    // Redirect to url view.
    this.viewUrl = function()
    {
      $location.path("/url/" + this.url.id);
    };

    // Flip the enabled flag on a url.
    this.toggleState = function(url)
    {
      url.enabled = !url.enabled;
      this.urls.$save();
    };

    // Flip the enabled flag on a url.
    this.setState = function(url, state)
    {
      url.enabled = state;
      this.urls.$save();
    };

    // Save a url.
    this.saveUrl = function(url)
    {
      this.edit.saving = true;
      var test = url.$save();
      test.then(function()
      {
        that.edit.saving = false;
      });
      this.edit.unsaved = false;
    };

    this.addNewQs = function(key, value)
    {
      var newQs = {};
      newQs[key] = value;
      if (!this.url.qs) this.url.qs = {};
      this.url.qs[key] = value;
      key = ""; value = "";
    };

    this.removeQs = function(qsKey)
    {
      delete this.url.qs[qsKey];
    };

    this.updateQs = function(qsKey, qsValue)
    {
      this.url.qs[qsKey] = qsValue;
    };

    this.removeVar = function(vKey)
    {
      delete this.url.vars[vKey];
    };

    this.updateVar = function(vKey, vValue)
    {
      this.url.vars[vKey] = vValue;
    };

    this.addNewDt = function(newDt)
    {
      if (!this.url.dataTypes) this.url.dataTypes = [];
      this.url.dataTypes.push(newDt);
    };

    this.removeDt = function(dataType)
    {
      var remIdx = this.url.dataTypes.indexOf(dataType);
      if (remIdx >= 0) this.url.dataTypes.splice(remIdx, 1);
    };

    this.unsaved = function()
    {
      this.edit.unsaved = true;
    };

    this.removeField = function(fieldName)
    {
      delete this.url[fieldName];
    };

    this.deleteUrl = function(url)
    {
      var modalInst = $modal.open({
        templateUrl: "partials/delete-url-dialog.html",
        controller: "DeleteUrlCtrl as deleteUrlCtrl",
        resolve: {
          url: function() { return url; }
        }
      });

      // When the dialog is closed by clicking "Confirm"...
      modalInst.result.then(function(urlToDelete)
      {
        urlToDelete.deleted = true;
        urlToDelete.enabled = false;
        urlToDelete.$save();
        $location.path("/");
      });
    };

  })
  .controller("DeleteUrlCtrl", function($modalInstance,  url)
  {
    this.url = url;
    this.cancel = function()
    {
      $modalInstance.dismiss('cancel');
    };

    this.deleteUrl = function()
    {
      // Test input name against url name.
      if (this.urlName === this.url.name)
      {
        $modalInstance.close(this.url);
      }
    };
  });
})();
