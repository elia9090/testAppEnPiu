app.controller('editPasswordCtrl', function ( $scope, $http, $location, alertify) {

    $scope.user = JSON.parse(sessionStorage.user);

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.password = "";

    $scope.password2 = "";

    $scope.submitEditPassword = function () {
        $http.post('/editPassword', {
            'userId' : $scope.user.Id,
            'password' : $scope.password
        }).then((result) => {
            alertify.alert("Password cambiata correttamente");
            var sessStore = JSON.parse(sessionStorage.user);
            sessStore.editPassword = "0";
            sessionStorage.user =  JSON.stringify(sessStore);
            $location.path('/dashboard');
        }).catch((err) => {
            if(err.status === 404){
                alertify.alert("Errore nel cambio password");
            }
            else if(err.status === 500){
                alertify.alert("Servizio di login non è disponibile");
            }
            else if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
            else{
                alertify.alert("Servizio di login non è disponibile");
                $location.path('/logout');
            }

        });
    };
});