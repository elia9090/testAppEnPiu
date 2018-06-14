
app.controller('loginCtrl', function ($scope, $http, $location, $window) {

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
            $scope.user.editPassword = result.data.editPassword;
            sessionStorage.user = JSON.stringify($scope.user);
            if(result.data.editPassword === "0"){
                $location.path('/dashboard');
            }else{
                $location.path('/editPassword');
            }
           
        }).catch((err) => {
            if(err.status === 404){
                alert("Nome utente o password errati!");
            }
            if(err.status === 500){
                alert("Servizio di login non è disponibile");
            }
        });
    };
});