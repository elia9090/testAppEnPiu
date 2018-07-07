app.controller('editUserCtrl', function ( $scope, $http, $location,$route,$routeParams) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $scope.editUser = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    var id = $routeParams.id;
    $http.get('/edituser/'+id).then((result) => {
        $scope.editUser.nome =result.data.utente.NOME;
        $scope.editUser.cognome =result.data.utente.COGNOME;
        $scope.editUser.username =result.data.utente.USERNAME;
        $scope.editUser.password = "";
        //preseleziono lo usertype dai radio button
        $scope.editUser.userType = result.data.utente.TIPO;
        $scope.editUser.operatoreAssociato = result.data.utente.ID_OPERATORE;
        $scope.editUser.responsabileAssociato = result.data.utente.ID_RESPONSABILE;

        }).catch((err) => {
            alert("Impossibile reperire l'utente");
        });




    $http.get('/listaResponsabiliAgentiWS').then((result) => {
        
    $scope.editUser.responsabili = result.data.responsabili;
    }).catch((err) => {
        alert("Impossibile reperire la lista dei responsabili");
    });
    $http.get('/listaOperatoriWS').then((result) => {
        $scope.editUser.operatori =  result.data.operatori;
    }).catch((err) => {
        alert("Impossibile reperire la lista degli operatori");
    });

    $scope.editUser.submitAddUser = function () {
        $http.post('/addUser', {
            'username' : $scope.editUser.username,
            'password' : $scope.editUser.password,
            'nome': $scope.editUser.nome,
            'cognome':$scope.editUser.cognome,
            'userType': $scope.userType,
            'operatoreAssociato' : $scope.editUser.operatoreAssociato,
            'responsabileAssociato' : $scope.editUser.responsabileAssociato
        }).then((result) => {
            alert('Utente creato correttamente');
            $route.reload();
        }).catch((err) => {
            if(err.status === 500){
                alert("Errore nella registrazione utente");
            }
            if(err.status === 400){
                alert("Utente già presente: "+ $$scope.editUser.username);
            }
            if(err.status === 403){
                alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    };
});
