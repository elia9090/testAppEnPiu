
var app = angular.module('gestionaleApp', ["ngRoute","chart.js",'ui.bootstrap','ngAlertify']);

app.run(['$rootScope', '$location', function($rootScope, $location, ) {
    $rootScope.$on('$routeChangeStart', function(event, currRoute, prevRoute){
        $rootScope.userRoot = "";
        if(!sessionStorage.user){
            $location.path('/login');
            return;
        }else{
            $rootScope.userRoot = "true";
            $rootScope.userType = JSON.parse(sessionStorage.user).TYPE;
            $rootScope.userEditedPassword = JSON.parse(sessionStorage.user).editPassword === "0" ? true : false;
        }
        //svuoto il local storage dei parametri di ricerca
        if(prevRoute && currRoute && (currRoute.$$route.controller=="dateSearchCtrl" || currRoute.$$route.controller=="verifyDateCtrl") && 
                (prevRoute.$$route.controller != "editDateAdminCtrl") 
                    && prevRoute.$$route.controller != "editDateOperatoreCtrl"
                        && prevRoute.$$route.controller != "editDateVenditoreCtrl"
                            && prevRoute.$$route.controller != "viewDateCtrl"){
                            //rimuovo il local storage dei parametri di ricerca
                            localStorage.removeItem("searchParam");

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
        }).when('/listaAppuntamenti', {
            templateUrl: '../partials/dateList.html',
            controller:'dateListCtrl'
        }).when('/listaAppuntamentiGruppoVendita', {
            templateUrl: '../partials/dateListGV.html',
            controller:'dateListGVCtrl'
        }).when('/ricercaAppuntamenti', {
            templateUrl: '../partials/dateSearch.html',
            controller:'dateSearchCtrl'
        })
        .when('/editPassword', {
            templateUrl: '../partials/editPassword.html',
            controller:'editPasswordCtrl'
        })
        .when('/viewDate/:id', {
            templateUrl: '../partials/viewAppuntamento.html',
            controller:'viewDateCtrl'
        })
        .when('/editDateAdmin/:id', {
            templateUrl: '../partials/editAppuntamentoAdmin.html',
            controller:'editDateAdminCtrl'
        })
        .when('/editDateOperatore/:id', {
            templateUrl: '../partials/editAppuntamentoOperatore.html',
            controller:'editDateOperatoreCtrl'
        })
        .when('/statisticheAppuntamenti', {
            templateUrl: '../partials/statisticheAppuntamenti.html',
            controller:'statisticheAppuntamentiCtrl'
        })
        .when('/verifyDate', {
            templateUrl: '../partials/verifyDate.html',
            controller:'verifyDateCtrl'
        })
        .when('/statisticheAppuntamentiGruppoVendita', {
            templateUrl: '../partials/statisticheAppuntamentiGruppoVendita.html',
            controller:'statisticheAppuntamentiGruppoVenditaCtrl'
        })
        .when('/editDateVenditore/:id', {
            templateUrl: '../partials/editAppuntamentoVenditore.html',
            controller:'editDateVenditoreCtrl'
		}).when('/modificaUtente/:id', {
            templateUrl: '../partials/modificaUtente.html',
            controller:'editUserCtrl'})
        .otherwise({redirectTo:'/'});
        
        // Configure all charts
        ChartJsProvider.setOptions({
        //  chartColors: ['green', '#FF8A80',"rgb(154,154,154)"],
            colors : [ '#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'],
            responsive: true
        });
}]);
