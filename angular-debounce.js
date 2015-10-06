'use strict';

angular.module('ngDebounce', [])
  .service('$debounce', ['$timeout', function ($timeout) {
    return function (func, wait, immediate, invokeApply) {
      var timeout, args, context, result;
      function debounce() {
        /* jshint validthis:true */
        context = this;
        args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
          }
        };
        var callNow = immediate && !timeout;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(later, wait, invokeApply);
        if (callNow) {
          result = func.apply(context, args);
        }
        return result;
      }
      debounce.cancel = function () {
        $timeout.cancel(timeout);
        timeout = null;
      };
      return debounce;
    };
  }])
  .directive('ngDebounce', ['$debounce', '$parse', function ($debounce, $parse) {
    return {
      require: 'ngModel',
      priority: 999,
      link: function ($scope, $element, $attrs, ngModelController) {
        var ngDebounceDuration = $parse($attrs.ngDebounce)($scope);
        var immediate = !!$parse($attrs.immediate)($scope);
        var ngDebouncedValue, pass;
        var prevRender = ngModelController.$render.bind(ngModelController);
        var commitSoon = $debounce(function (viewValue) {
          pass = true;
          ngModelController.$$lastCommittedViewValue = ngDebouncedValue;
          ngModelController.$setViewValue(viewValue);
          pass = false;
        }, parseInt(ngDebounceDuration, 10), immediate);
        ngModelController.$render = function () {
          prevRender();
          commitSoon.cancel();
          //we must be first parser for this to work properly,
          //so we have priority 999 so that we unshift into parsers last
          ngDebouncedValue = this.$viewValue;
        };
        ngModelController.$parsers.unshift(function (value) {
          if (pass) {
            ngDebouncedValue = value;
            return value;
          } else {
            commitSoon(ngModelController.$viewValue);
            return ngDebouncedValue;
          }
        });
      }
    };
  }]);
