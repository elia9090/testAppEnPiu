app.controller('usersListCtrl', function ( $scope, $http, $location, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    $scope.usersList = [];
    
    $http.get('/listaUtenti').then((result) => {
        
    $scope.usersList = result.data.utenti;
    
    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire la lista degli utenti");
    });
  

    $scope.modifyUser = function (id) {
            $location.path('/modificaUtente/'+id);
        
    };
});