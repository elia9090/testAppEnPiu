app.controller('editRicontattoAppuntamentoCtrl',['$scope', '$http', '$location','$routeParams','$route', 'alertify', function ($scope, $http, $location,$routeParams,$route, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   

    $scope.editRicontatto = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.idAppuntamento;

    $scope.editRicontatto.Appuntamento = {};

    $scope.editRicontatto.storicoRicontatti = {};

    $http.get('/appuntamento/'+idAppuntamento).then((result) => {

        $scope.editRicontatto.Appuntamento =  result.data.appuntamento;
    

    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
    });

    $http.get('/storicoRicontatti/'+idAppuntamento).then((result) => {

        $scope.editRicontatto.storicoRicontatti =  result.data.storicoRicontatti;
    

    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        if(err.status !== 404){
            alertify.alert("Impossibile reperire lo storico ricontatti per l'appuntamento: "+idAppuntamento);
        }
       
    });

    $scope.editRicontatto.esito={};

    $scope.editRicontatto.Esiti =    [
        {
            "Name":"NON INTERESSATO",
            "Value":"NON INTERESSATO"
        },
        {
            "Name":"DA RICHIAMARE",
            "Value":"DA RICHIAMARE"
        },
        {
            "Name":"APPUNTAMENTO",
            "Value":"APPUNTAMENTO"
        },
        {
            "Name":" ",
            "Value":" "
        }
        
    ];


    $scope.editRicontatto.cancel = function () {
        $location.path('/ricontattoAppuntamenti');
    };


    $scope.editRicontatto.editRicontattoSubmit = function (createAppuntamento){

    var idOperatore = $scope.user.Id;
    

    $http.post('/addRicontatto', {
        'idAppuntamento' :  $scope.editRicontatto.Appuntamento.ID_APPUNTAMENTO,
        'idOperatore' : idOperatore,
        'noteOperatore': $scope.editRicontatto.noteRicontattoOperatore,
        'esitoRicontatto': $scope.editRicontatto.esito.value

     }).then((result) => {
         alertify.alert('Esito salvato correttamente');
         if(createAppuntamento=='CREATE_APPUNTAMENTO'){
            $location.path('/nuovoAppuntamento/'+$scope.editRicontatto.Appuntamento.ID_APPUNTAMENTO);
         }else{
            $location.path('/ricontattoAppuntamenti');
         }
         
     }).catch((err) => {
         if(err.status === 500){
             alertify.alert("Errore nella modifica del ricontatto");
         }
         if(err.status === 403){
             alertify.alert("Utente non autorizzato");
             $location.path('/logout');
         }
     });

}

}]);