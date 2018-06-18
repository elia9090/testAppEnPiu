app.controller('dateListCtrl', function ( $scope, $http, $location,$route) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    $scope.dateList = [];
    
    var url = "";

    if($scope.user.TYPE == "ADMIN"){
        url = '/listaAppuntamentiAdmin';
    }else if($scope.user.TYPE == "OPERATORE"){
        url = '/listaAppuntamentiOperatore/'+$scope.user.id;
    }else if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        url = '/listaAppuntamentiVenditore/'+$scope.user.id;
    }



    
    $http.get(url).then((result) => {
        
    $scope.dateList = result.data.appuntamenti;
    
    }).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire la lista degli appuntamenti");
    });
  

    $scope.modifyDate = function (id) {
        if($scope.user.TYPE == "ADMIN"){
            $location.path('/editDateAdmin/'+id);
        }
        else if($scope.user.TYPE == "OPERATORE"){
            $location.path('/editDateOperatore/'+id);
        }
        else if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI"){
            $location.path('/editDateVenditore/'+id);
        }
       
    };

    $scope.rowClass = function (esito) {
        if (esito=='OK'){
            return 'green-background'
        }else if (esito=='KO'){
            return 'red-background'
        }else{
            return 'white-background'
        }
        
    };


});