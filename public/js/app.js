
var app = angular.module('gestionaleApp', ["ngRoute"]);
app.config(['$routeProvider','$locationProvider', function ($routeProvider, $locationProvider) {

    $routeProvider
        .when('/pippo', {
            templateUrl : "./pippo.html",
            
        });
		
		
    
}])
app.controller('gestionaleAppCtrl', function ($scope, $http, $location, $window) {
    $scope.submitLogin = function () {
        $http.post('/login', {
            'username' : $scope.username,
            'password' : $scope.password
        }).then((result) => {
            $location.path('/pippo');
        }).catch((err) => {
            
        });
    };
});