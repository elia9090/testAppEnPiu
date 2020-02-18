app.controller('statisticheAppuntamentiGruppoVenditaCtrl',['$scope', '$http', '$location', 'alertify', function ( $scope, $http, $location, alertify) {
   
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
        
            $scope.statsDate.statsDateArray = result.data.stats;

            $scope.statsDate.statsVenditori = $scope.statsDate.statsDateArray.filter(function (utente) {
                return (utente.TIPO == "AGENTE" || utente.TIPO == "RESPONSABILE_AGENTI");
            });

            $scope.statsDate.statsOperatori = $scope.statsDate.statsDateArray.filter(function (utente) {
                return (utente.TIPO == "OPERATORE");
            });
     
            $scope.statsDate.showRisultati = true;
            

            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    
                    $location.path('/logout');
                    return;
                }
                if(err.status === 404){
                    
                    alertify.alert("Non ci sono statistiche per i parametri selezionati");
                    return;
                }
                
                alertify.alert("Impossibile reperire le statistiche");
            });
    };

    $scope.statsDate.mostraAppuntamenti = function(idUtente){

        
       
        var dateFROM = "";
        var dateTO = "";

        if(typeof $scope.statsDate.dataAppuntamentoDAL != 'undefined' && $scope.statsDate.dataAppuntamentoDAL){
            dateFROM = $scope.statsDate.dataAppuntamentoDAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoDAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoDAL.getDate();
        }
        if(typeof $scope.statsDate.dataAppuntamentoAL != 'undefined' && $scope.statsDate.dataAppuntamentoAL){
            dateTO = $scope.statsDate.dataAppuntamentoAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoAL.getDate();
        }

        $http.post("/verifyDateStats", {
            'dateFROM': dateFROM,
            'dateTO': dateTO,
            'operatore': $scope.statsDate.operatoriSelected,
            'agente': $scope.statsDate.venditoreSelected,
            'idUtente':idUtente
        }).then((result) => {
        
            $scope.statsDate.recapStatisticheAppuntamenti = result.data.verifyStats;
            $('#recapStatisticheAppuntamenti').modal('show');
            

            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    
                    $location.path('/logout');
                    return;
                }
                if(err.status === 404){
                    
                    alertify.alert("Non ci sono statistiche per i parametri selezionati");
                    return;
                }
                
                alertify.alert("Impossibile reperire le statistiche");
            });
    };

    $scope.statsDate.tdEsitoClass = function (esito) {
        if (esito=='OK'){
            return 'green-background'
        }else if (esito=='KO'){
            return 'red-background'
        }else if(esito == 'VALUTA'){
            return 'yellow-background'
        } else if(esito == 'ASSENTE' || esito == 'NON VISITATO'){
            return 'grey-background'
        }else{
            return 'white-background'
        }
        
    };

}]);