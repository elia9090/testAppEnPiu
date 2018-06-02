
var app = angular.module('gestionaleApp', ["ngRoute"]);

app.run(['$rootScope', '$location',  function($rootScope, $location) {
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
		});

}])

app.controller('loginAppCtrl', function ($scope, $http, $location, $window) {
    $scope.submitLogin = function () {
        $http.post('/login', {
            'username' : $scope.username,
            'password' : $scope.password
        }).then((result) => {
            $scope.user = {};
            $scope.user.Id = result.data.utente.ID_UTENTE;
            $scope.user.NAME = result.data.utente.NOME;
            $scope.user.SURNAME = result.data.utente.COGNOME;
            $scope.user.TYPE = result.data.utente.TIPO;
            $scope.user.USERNAME = result.data.utente.USERNAME;
            $scope.user.TOKEN = result.data.token;
            sessionStorage.user = JSON.stringify($scope.user);
            $location.path('/dashboard');
        }).catch((err) => {
            
        });
    };
});
app.controller('dashboardAppCtrl', function ( $scope, $http, $location, $window) {

    $scope.user = JSON.parse(sessionStorage.user);
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    $http.get('/userList').then((result) => {
        console.log(result);
    }).catch((err) => {
        if(err.status == 403){
            sessionStorage.clear();
            $location.path('/login');
        }

    });
});