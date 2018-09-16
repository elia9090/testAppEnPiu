app.controller('statisticheAppuntamentiGruppoVenditaCtrl', function ( $scope, $http, $location,$routeParams,$route, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);

    $scope.statsDate = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    $scope.statsDate.URL = "";

    $scope.statsDate.showRisultati = false;

    //DATEPICKER
  
    $scope.dateOptions = {
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.format="dd/MM/yyyy";

    $scope.openDAL = function() {
        $scope.popupDAL.opened = true;
    };
    $scope.popupDAL = {
        opened: false
    };
    $scope.openAL = function() {
        $scope.popupAL.opened = true;
    };
    $scope.popupAL = {
        opened: false
    };

    $scope.statsDate.URL = "/dateStatsGruppoVendita";

   
    $http.get('/listaAgentiForResponsabile/'+$scope.user.Id).then((result) => {
        $scope.statsDate.agenti = result.data.utenti;
       
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            
            $scope.statsDate.agenti = [];
        });

    $scope.statsDate.submitstatsDate = function(){

        $.blockUI();
       
        var dateFROM = "";
        var dateTO = "";

        if(typeof $scope.statsDate.dataAppuntamentoDAL != 'undefined' && $scope.statsDate.dataAppuntamentoDAL){
            dateFROM = $scope.statsDate.dataAppuntamentoDAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoDAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoDAL.getDate();
        }
        if(typeof $scope.statsDate.dataAppuntamentoAL != 'undefined' && $scope.statsDate.dataAppuntamentoAL){
            dateTO = $scope.statsDate.dataAppuntamentoAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoAL.getDate();
        }

        $http.post($scope.statsDate.URL, {
            'idResponsabile':$scope.user.Id,
            'dateFROM': dateFROM,
            'dateTO': dateTO,
            'agente': $scope.statsDate.venditoreSelected,
        }).then((result) => {
        
            $scope.statsDate.statsVenditori = result.data.stats;
     
            $scope.statsDate.showRisultati = true;
            $.unblockUI();

            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $.unblockUI();
                    $location.path('/logout');
                    return;
                }
                if(err.status === 404){
                    $.unblockUI();
                    alertify.alert("Non ci sono statistiche per i parametri selezionati");
                    return;
                }
                $.unblockUI();
                alertify.alert("Impossibile reperire le statistiche");
            });
    };

});