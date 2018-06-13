
app.controller('nuovoAppuntamentoCtrl', function ( $scope, $http, $location, $window) {
    
    $scope.user = JSON.parse(sessionStorage.user);
   
    if($scope.user.TYPE !== "ADMIN" && $scope.user.TYPE !== "OPERATORE"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    
    if($scope.user.TYPE == "OPERATORE"){
        //variabile utile per il submit START
        $scope.operatoriSelected = $scope.user.Id;
        //variabile utile per il submit END

        $http.get('/listaUtentiForOperatore/'+$scope.user.Id).then((result) => {
        
            $scope.venditoriForOperatore = result.data.utenti;
            }).catch((err) => {
                if(err.status === 403){
                    alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alert("Impossibile reperire la lista degli agenti associati");
            });
    }

    if($scope.user.TYPE == "ADMIN"){

        $scope.disabledListaAgenti = true;
        
        $http.get('/listaOperatoriWS').then((result) => {
            $scope.operatori =  result.data.operatori;
        }).catch((err) => {
            alert("Impossibile reperire la lista degli operatori");
        });
        

        $scope.showAgentiForOperatore = function(idOperatore){
            //variabile utile per il submit START
            $scope.operatoriSelected = idOperatore;
            //variabile utile per il submit END
            $http.get('/listaUtentiForOperatore/'+idOperatore).then((result) => {
                $scope.venditoriForOperatore = result.data.utenti;
                $scope.disabledListaAgenti = false;
                }).catch((err) => {
                    if(err.status === 403){
                        alert("Utente non autorizzato");
                        $location.path('/logout');
                        return;
                    }
                    alert("L'operatore selezionato non ha agenti associati");
                    $scope.disabledListaAgenti = true;
                    $scope.venditoriForOperatore = "";
                });
           
        }

    }
  

    
    $http.get('../../utility/province_comuni.json').then((result) => {
        $scope.provinciaSelected = "";
        $scope.province = result.data.province;
    }).catch((err) => {
        alert("Impossibile reperire la lista dei comuni");
    });
    $scope.comuniPerProvincia = "";
    $scope.disabledComuni = true;
    
    $scope.showComuni = function(){
        var newArray = $scope.province.filter(function (el) {
            return el.nome ===  $scope.provinciaSelected;
          });
        $scope.comuniPerProvincia = newArray[0].comuni;
        $scope.disabledComuni = false;
    }
    

});