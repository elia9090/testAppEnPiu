app.controller('editUserCtrl', function ( $scope, $http, $location,$route,$routeParams) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    var id = $routeParams.id;
    $http.get('/edituser/'+id).then((result) => {
        $scope.nome =result.data.utente.NOME;
        $scope.cognome =result.data.utente.COGNOME;
        $scope.username =result.data.utente.USERNAME;
        $scope.password = "";
        //preseleziono lo usertype dai radio button
        $scope.userType = result.data.utente.TIPO;
        $scope.operatoreAssociato = result.data.utente.ID_OPERATORE;
        $scope.responsabileAssociato = result.data.utente.ID_RESPONSABILE;
        $scope.operatori = "";
        $scope.responsabili = "";
        }).catch((err) => {
            alert("Impossibile reperire l'utente");
        });




    $http.get('/listaResponsabiliAgentiWS').then((result) => {
        
    $scope.responsabili = result.data.responsabili;
    }).catch((err) => {
        alert("Impossibile reperire la lista dei responsabili");
    });
    $http.get('/listaOperatoriWS').then((result) => {
        $scope.operatori =  result.data.operatori;
    }).catch((err) => {
        alert("Impossibile reperire la lista degli operatori");
    });

    $scope.submitAddUser = function () {
        $http.post('/addUser', {
            'username' : $scope.username,
            'password' : $scope.password,
            'nome': $scope.nome,
            'cognome':$scope.cognome,
            'userType': $scope.userType,
            'operatoreAssociato' : $scope.operatoreAssociato,
            'responsabileAssociato' : $scope.responsabileAssociato
        }).then((result) => {
            alert('Utente creato correttamente');
            $route.reload();
        }).catch((err) => {
            if(err.status === 500){
                alert("Errore nella registrazione utente");
            }
            if(err.status === 400){
                alert("Utente già presente: "+ $scope.username);
            }
            if(err.status === 403){
                alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    };
});