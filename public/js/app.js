
var app = angular.module('gestionaleApp', ["ngRoute","chart.js",'ui.bootstrap']);

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
            controller:'dashboardCtrl'
         }).when('/login', {
            templateUrl : "../partials/login.html",
            controller:'loginCtrl'
        }).when('/dashboard', {
            templateUrl: '../partials/dashboard.html',
            controller:'dashboardCtrl'
		}).when('/logout', {
            template: '',
            controller:'logoutCtrl'
        }).when('/nuovoAppuntamento', {
            templateUrl : "../partials/nuovoAppuntamento.html",
            controller:'nuovoAppuntamentoCtrl'
         }).when('/aggiuntiUtente', {
            templateUrl: '../partials/aggiuntiUtente.html',
            controller:'addUserCtrl'
		}).when('/listaUtenti', {
            templateUrl: '../partials/usersList.html',
            controller:'usersListCtrl'
		})
        .otherwise({redirectTo:'/'});
        
        // Configure all charts
        ChartJsProvider.setOptions({
        //  chartColors: ['green', '#FF8A80',"rgb(154,154,154)"],
            colors : [ '#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'],
            responsive: true
        });
}]);

