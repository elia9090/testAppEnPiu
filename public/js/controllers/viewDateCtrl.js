app.controller('usersListCtrl', function ( $scope, $http, $location,$route) {

    $scope.user = JSON.parse(sessionStorage.user);
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.viewDate = {};

    var idAppuntamento = $routeParams.id;
    
    $scope.viewDate.Appuntamento = {};

    $http.get('/appuntamento/'+idAppuntamento).then((result) => {

        $scope.viewDate.Appuntamento =  result.data.appuntamento;

        

    }).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
    });

});