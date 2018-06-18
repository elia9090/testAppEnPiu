app.controller('editDateCtrl', function ( $scope, $http, $location,$routeParams,$q) {
   
    $scope.user = JSON.parse(sessionStorage.user);

    $scope.editDate = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.id;
    
    $scope.editDate.Appuntamento = {};
   
    $http.get('/appuntamento/'+idAppuntamento).then((result) => {
        $scope.editDate.Appuntamento =  result.data.appuntamento;
    }).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
        $location.path('/listaAppuntamenti');
    });

    $scope.editDate.IS_VENDITORE = $scope.user.TYPE == "RESPONSABILE_AGENTI" || $scope.user.TYPE == "AGENTE";
    $scope.editDate.IS_ADMIN = $scope.user.TYPE == "ADMIN";
    $scope.editDate.IS_OPERATORE = $scope.user.TYPE == "OPERATORE";
   
    $scope.editDate.dateOptions = {
        minDate: new Date(),
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
      $scope.editDate.altInputFormats = ['M!/d!/yyyy'];
    $scope.editDate.format="dd/MM/yyyy";

    $scope.editDate.open = function() {
        $scope.editDate.popup.opened = true;
    };
    $scope.editDate.popup = {
        opened: false
    };

    //TIMEPICKER
    $scope.editDate.hstep = 1;
    $scope.editDate.mstep = 15;
    //setto come default l'orario l'orario dell'appuntamento
    var ora = parseInt($scope.editDate.Appuntamento.ORA_APPUNTAMENTO.split(":")[0]);
    var minuti = parseInt($scope.editDate.Appuntamento.ORA_APPUNTAMENTO.split(":")[1]);
    var dateTime = new Date();
    dateTime.setHours(ora);
    dateTime.setMinutes(minuti);
    $scope.editDate.oraAppuntamento=dateTime;

    $scope.editDate.dataAppuntamento = $scope.editDate.Appuntamento.DATA_APPUNTAMENTO;


});