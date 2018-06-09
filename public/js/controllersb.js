


app.controller('usersList', function ( $scope, $http, $location,$route) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    
    $scope.usersList = [];
    



    $http.get('/listaUtenti').then((result) => {
        
    $scope.usersList = result.data.utenti;
    
    }).catch((err) => {
        alert("Impossibile reperire la lista degli utenti");
    });
  

    $scope.modifyUser = function (id) {
        console.log(id);
    };
});

