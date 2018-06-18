app.controller('editDateAdminCtrl', function ( $scope, $http, $location,$routeParams) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $scope.editDateAdmin = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.id;
    
    $scope.editDate.Appuntamento = {};
   
    $http.get('/appuntamento/'+idAppuntamento).then((result) => {
        $scope.editDate.Appuntamento =  result.data.appuntamento;
        var ora = parseInt($scope.editDate.Appuntamento.ORA_APPUNTAMENTO.split(":")[0]);
        var minuti = parseInt($scope.editDate.Appuntamento.ORA_APPUNTAMENTO.split(":")[1]);
        var dateTime = new Date();
        dateTime.setHours(ora);
        dateTime.setMinutes(minuti);
        $scope.editDate.oraAppuntamento=dateTime;
        $scope.editDate.dataAppuntamento = new Date($scope.editDate.Appuntamento.DATA_APPUNTAMENTO);

    }).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
        $location.path('/listaAppuntamenti');
    });
   
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

    


});