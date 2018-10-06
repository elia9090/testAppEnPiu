app.controller('editUserCtrl', function ( $scope, $http, $location,$routeParams, $q, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $scope.editUser = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    var id = $routeParams.id;

    $http.get('/edituser/'+id).then((result) => {
        $scope.userId=result.data.utente.ID_UTENTE;
        $scope.editUser.nome =result.data.utente.NOME;
        $scope.editUser.cognome =result.data.utente.COGNOME;
        $scope.editUser.username =result.data.utente.USERNAME;
        $scope.editUser.password = "";
        //preseleziono lo usertype dai radio button
        $scope.editUser.userType = result.data.utente.TIPO;
        $scope.previousUserType = result.data.utente.TIPO;
        $scope.editUser.operatoreAssociato = result.data.utente.ID_OPERATORE;
        $scope.previousOperatoreAssociato = result.data.utente.ID_OPERATORE;
        $scope.editUser.responsabileAssociato = result.data.utente.ID_RESPONSABILE;
        $scope.previousResponsabileAssociato = result.data.utente.ID_RESPONSABILE;
        $scope.editUser.supervisoreAssociato = result.data.utente.ID_SUPERVISORE;
        $scope.previousSupervisoreAssociato = result.data.utente.ID_SUPERVISORE;

        if($scope.editUser.userType != 'ADMIN'){
            $http.get('/listaResponsabiliAgentiWS').then((result) => {
        
                $scope.editUser.responsabili = result.data.responsabili;
                }).catch((err) => {
                    alertify.alert("Impossibile reperire la lista dei responsabili");
                });
                $http.get('/listaOperatoriWS').then((result) => {
                    $scope.editUser.operatori =  result.data.operatori;
                }).catch((err) => {
                    alertify.alert("Impossibile reperire la lista degli operatori");
                });
        }

       

        }).catch((err) => {
            alertify.alert("Impossibile reperire l'utente");
        });

    $scope.cancel = function () {
        $location.path('/listaUtenti');
    };


$scope.delete = function () {
    alertify.confirm("Vuoi eliminare l'utente ?", function(){ 
    
        $http.post('/deleteUser',{
        'userId' : $scope.userId
    }).then((result) => {
        alertify.alert("Utente eliminato");
        $location.path('/listaUtenti');
        }).catch((err) => {
            alertify.alert("Impossibile eliminare l'utente");
        });
    
});
}

    $scope.editUser.submitAddUser = function () {
        if ($scope.editUser.userType=='OPERATORE'){
            $scope.editUser.operatoreAssociato=null;
            $scope.editUser.responsabileAssociato=null;
            $scope.editUser.supervisoreAssociato=null;
        }else if ($scope.editUser.userType=='RESPONSABILE_AGENTI'){
            $scope.editUser.responsabileAssociato=null;
        }



        var promises = [];
        promises.push( $http.post('/updateUser', {
            'userId' : $scope.userId,
            'username' : $scope.editUser.username,
            'password' : $scope.editUser.password,
            'nome': $scope.editUser.nome,
            'cognome':$scope.editUser.cognome,
            'userType': $scope.editUser.userType
        }));
        if($scope.editUser.operatoreAssociato !== $scope.previousOperatoreAssociato){
            promises.push(   $http.post('/updateOperatore', {
                'userId' : $scope.userId,
                'oldOperatore' : $scope.previousOperatoreAssociato,
                'newOperatore': $scope.editUser.operatoreAssociato,
                
            })
        )
    };

    if($scope.editUser.responsabileAssociato !== $scope.previousResponsabileAssociato){
        promises.push( $http.post('/updateResponsabile', {
            'userId' : $scope.userId,
            'oldResponsabile' : $scope.previousResponsabileAssociato,
            'newResponsabile': $scope.editUser.responsabileAssociato,
            
        }));

    };
    if($scope.editUser.supervisoreAssociato !== $scope.previousSupervisoreAssociato){
        promises.push( $http.post('/updateSupervisore', {
            'userId' : $scope.userId,
            'oldSupervisore' : $scope.previousSupervisoreAssociato,
            'newSupervisore': $scope.editUser.supervisoreAssociato,
            
        }));

    };


    $q.all(promises).then((result) => {
        alertify.alert('Dati utente modificati correttamente');
        $location.path('/listaUtenti');
       
    }).catch((err) => {
        if(err.status === 500){
            alertify.alert("Errore nella maodifica utente");
        };

        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
        }
    });







  /*
       
       $http.post('/updateUser', {
            'userId' : $scope,userId,
            'username' : $scope.editUser.username,
            'password' : $scope.editUser.password,
            'nome': $scope.editUser.nome,
            'cognome':$scope.editUser.cognome,
            'userType': $scope.editUser.userType
        }).then((result) => {
            alertify.alert('Utente creato correttamente');
           
        }).catch((err) => {
            if(err.status === 500){
                alertify.alert("Errore nella registrazione utente");
            }

            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
        
    if($scope.editUser.operatoreAssociato !== $scope.previousOperatoreAssociato){
        $http.post('/updateOperatore', {
            'userId' : $scope,userId,
            'oldOperatore' : $scope.previousOperatoreAssociato,
            'newOperatore': $scope.editUser.operatoreAssociato,
            
        }).then((result) => {
            alertify.alert('Relazione operatore modificata correttamente');
          
        }).catch((err) => {
            if(err.status === 500){
                alertify.alert("Errore nella modifica operatore");
            }

            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    }

    


    if($scope.editUser.responsabileAssociato !== $scope.previousResponsabileAssociato){
        $http.post('/updateResponsabile', {
            'userId' : $scope,userId,
            'oldResponsabile' : $scope.previousResponsabileAssociato,
            'newResponsabile': $scope.editUser.responsabileAssociato,
            
        }).then((result) => {
            alertify.alert('Relazione operatore modificata correttamente');
           
        }).catch((err) => {
            if(err.status === 500){
                alertify.alert("Errore nella modifica operatore");
            }

            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    }

*/



    };
});
