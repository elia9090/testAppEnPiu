
var app = angular.module('gestionaleApp', ["ngRoute"]);
app.config(function($routeProvider) {
    $routeProvider
    .when("/dashboard ", {
        templateUrl : "dashboard.html"
    });
});
app.controller('gestionaleAppCtrl', function ($scope, $http, $location, $window) {
    $scope.submitLogin = function () {
        $http.post('/login', {
            'username' : $scope.username,
            'password' : $scope.password
        }).then((result) => {
            $window.location.href = "/dashboard";
        }).catch((err) => {
            
        });
    };
});