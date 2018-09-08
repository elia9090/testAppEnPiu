app.controller('statisticheAppuntamentiCtrl', function ( $scope, $http, $location,$routeParams,$route, alertify) {
   
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


    if($scope.user.TYPE == "ADMIN"){
        

        $scope.statsDate.URL = "/dateStats";

        //LISTA OPERATORI
        $http.get('/listaOperatoriWS').then((result) => {
            $scope.statsDate.operatori =  result.data.operatori;
            
           
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli operatori");
        });
        
        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI E ELIMINATI LOGICAMENTE
        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWS').then((result) => {
            $scope.statsDate.agenti =  result.data.agenti;
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });

        


    }
    else if($scope.user.TYPE == "OPERATORE"){

        $scope.statsDate.URL = "/dateStats";
        $scope.statsDate.operatoriSelected = $scope.user.Id; 
        
    }
    else if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        
        $scope.statsDate.URL = "/dateStats";
        $scope.statsDate.venditoreSelected = $scope.user.Id; 

    }


    $scope.statsDate.submitstatsDate = function(){

        $.blockUI();
       
        var dateFROM = "";
        var dateTO = "";

        if(typeof $scope.statsDate.dataAppuntamentoDAL != 'undefined'){
            dateFROM = $scope.statsDate.dataAppuntamentoDAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoDAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoDAL.getDate();
        }
        if(typeof $scope.statsDate.dataAppuntamentoAL != 'undefined'){
            dateTO = $scope.statsDate.dataAppuntamentoAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoAL.getDate();
        }

        $http.post($scope.statsDate.URL, {
            'dateFROM': dateFROM,
            'dateTO': dateTO,
            'operatore': $scope.statsDate.operatoriSelected,
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