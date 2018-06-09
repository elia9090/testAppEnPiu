
var app = angular.module('gestionaleApp', ["ngRoute","chart.js"]);

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

app.config(['$routeProvider','$locationProvider', 'ChartJsProvider', function ($routeProvider, $locationProvider, ChartJsProvider) {
    $routeProvider
        .when('/', {
            templateUrl : "../partials/dashboard.html",
            controller:'dashboardAppCtrl'
         }).when('/login', {
            templateUrl : "../partials/login.html",
            controller:'loginAppCtrl'
        }).when('/dashboard', {
            templateUrl: '../partials/dashboard.html',
            controller:'dashboardAppCtrl'
		}).when('/logout', {
            template: '',
            controller:'logoutCtrl'
        }) .when('/nuovoAppuntamento', {
            templateUrl : "../partials/nuovoAppuntamento.html",
            controller:'nuovoAppuntamentoAppCtrl'
         }).when('/aggiuntiUtente', {
            templateUrl: '../partials/aggiuntiUtente.html',
            controller:'addUser'
		}).when('/listaUtenti', {
            templateUrl: '../partials/usersList.html',
            controller:'usersList'
		})
        .otherwise({redirectTo:'/'});
        
            // Configure all charts
            ChartJsProvider.setOptions({
            //  chartColors: ['green', '#FF8A80',"rgb(154,154,154)"],
             colors : [ '#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'],
              responsive: true
            });
}]);
