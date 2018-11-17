app.controller('viewDateCtrl',['$scope', '$http', '$location','$routeParams', 'alertify', function ( $scope, $http, $location,$routeParams, alertify) {

    $scope.user = JSON.parse(sessionStorage.user);
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.viewDate = {};

    var idAppuntamento = $routeParams.id;
    
    $scope.viewDate.Appuntamento = {};

    $http.get('/appuntamento/'+idAppuntamento).then((result) => {

        $scope.viewDate.Appuntamento =  result.data.appuntamento;


        if($scope.viewDate.Appuntamento.ESITO !== null 
                && $scope.viewDate.Appuntamento.ESITO !== " " 
                    && $scope.viewDate.Appuntamento.ESITO !== "")
                    {
                        $scope.viewDate.hasEsito = true;

                    }else{
                        $scope.viewDate.hasEsito = false;
                    }
        
        if($scope.viewDate.Appuntamento.ESITO == 'OK'){
            $scope.viewDate.hasEsito_OK = true;
        }else{
            $scope.viewDate.hasEsito_OK = false;
        }

    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
    });

    $scope.viewDate.cancel = function () {
        window.history.back();
    };




}]);