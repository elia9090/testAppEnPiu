app.controller('dateListCtrl', function ( $scope, $http, $location,$route) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    $scope.usersList = [];
    
    $http.get('/listaAppuntamenti').then((result) => {
        
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
        $location.path('/editDate/'+id);
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