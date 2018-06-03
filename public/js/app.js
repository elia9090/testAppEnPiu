
var app = angular.module('gestionaleApp', ["ngRoute"]);

app.run(['$rootScope', '$location', function($rootScope, $location, ) {
    $rootScope.$on('$routeChangeStart', function(event, currRoute, prevRoute){
        $rootScope.userRoot = "";
        if(!sessionStorage.user){
            $location.path('/login');
            return;
        }else{
            $rootScope.userRoot = "true";
            $rootScope.userType = JSON.parse(sessionStorage.user).TYPE;
        }
    });

}]);

app.config(['$routeProvider','$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl : "../partials/dashboard.html",
            
         }).when('/login', {
            templateUrl : "../partials/login.html",
            
        }).when('/dashboard', {
			templateUrl: '../partials/dashboard.html',
		}).when('/logout', {
            template: '',
            controller:'logoutCtrl'
		});

}]);
