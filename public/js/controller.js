
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
    // $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    // $http.get('/userList').then((result) => {
    //     console.log(result);
    // }).catch((err) => {
    //     if(err.status == 403){
    //         sessionStorage.clear();
    //         $location.path('/login');
    //     }

    // });


});
app.controller('logoutCtrl', function ( $scope, $http, $location, $window) {
    document.getElementById("navbarToggleExternalContent").classList.remove("show");
    document.getElementById("btnMenuHome").setAttribute("aria-expanded", false);
    sessionStorage.clear();
    $location.path('/login');
});