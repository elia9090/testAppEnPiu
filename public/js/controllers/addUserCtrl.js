app.controller('addUserCtrl',[ '$scope', '$http', '$location','$route','alertify', function ( $scope, $http, $location,$route,alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN" && !$scope.user.TYPE == "RESPONSABILE_AGENTI"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    
    $scope.nome = "";
    $scope.cognome = "";
    $scope.username = "";
    $scope.password = "";
    //preseleziono lo usertype dai radio button
    $scope.userType = "AGENTE_JUNIOR";
    $scope.operatoreAssociato = "";
    $scope.responsabileAssociato = "";
    $scope.supervisoreAssociato = "";
    $scope.operatori = "";
    $scope.responsabili = "";


    if($scope.user.TYPE == "RESPONSABILE_AGENTI"){
        // se l'utente loggato è responsabile agente il responsabile dell'AGENTE JUNIOR è LUI
        $scope.responsabileAssociato = $scope.user.Id  
    }

    $http.get('/listaResponsabiliAgentiWS').then((result) => {
        
    $scope.responsabili = result.data.responsabili;
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei responsabili");
    });
    $http.get('/listaOperatoriWS').then((result) => {
        $scope.operatori =  result.data.operatori;
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista degli operatori");
    });

    $scope.submitAddUser = function () {
        $http.post('/addUser', {
            'username' : $scope.username,
            'password' : $scope.password,
            'nome': $scope.nome,
            'cognome':$scope.cognome,
            'userType': $scope.userType,
            'operatoreAssociato' : $scope.operatoreAssociato,
            'responsabileAssociato' : $scope.responsabileAssociato,
            'supervisoreAssociato' : $scope.supervisoreAssociato
        }).then((result) => {
            alertify.alert('Utente creato correttamente');
            $route.reload();
        }).catch((err) => {
            if(err.status === 500){
                alertify.alert("Errore nella registrazione utente");
            }
            if(err.status === 400){
                alertify.alert("Utente già presente: "+ $scope.username);
            }
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    };
}]);
