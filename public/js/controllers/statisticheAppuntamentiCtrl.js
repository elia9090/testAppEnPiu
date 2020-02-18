app.controller('statisticheAppuntamentiCtrl',[ '$scope', '$http', '$location', 'alertify', function ( $scope, $http, $location, alertify) {
   
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

    $scope.downloadStats = function () {

        var dateFROM = "";
        var dateTO = "";

        if(typeof $scope.statsDate.dataAppuntamentoDAL != 'undefined' && $scope.statsDate.dataAppuntamentoDAL){
            dateFROM = $scope.statsDate.dataAppuntamentoDAL.getDate() + "-" + ($scope.statsDate.dataAppuntamentoDAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoDAL.getFullYear();
        }
        if(typeof $scope.statsDate.dataAppuntamentoAL != 'undefined' && $scope.statsDate.dataAppuntamentoAL){
            dateTO = $scope.statsDate.dataAppuntamentoAL.getDate() + "-" + ($scope.statsDate.dataAppuntamentoAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoAL.getFullYear();
        }else{
            var today = new Date()
            dateTO= today.getDate() + "-" + (today.getMonth()+1) + "-" + today.getFullYear();
        }

        var workbookName = "Statistiche";
        if(dateFROM){
            workbookName += "_DAL_" + dateFROM + "_AL_" + dateTO;
        }else{
            workbookName += "_AL_" + dateTO;
        }

        var workbook = XLSX.utils.book_new();
        var ws1 = XLSX.utils.table_to_sheet(document.getElementById('tabella-agenti'));
        XLSX.utils.book_append_sheet(workbook, ws1, "AGENTI");
        var ws2 = XLSX.utils.table_to_sheet(document.getElementById('tabella-operatori'));
        XLSX.utils.book_append_sheet(workbook, ws2, "OPERATORI");
        var wbout = XLSX.write(workbook, {bookType:'xlsx', bookSST:true, type: 'binary'});
        function s2ab(s) {
                        var buf = new ArrayBuffer(s.length);
                        var view = new Uint8Array(buf);
                        for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                        return buf;
        }
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), workbookName+'.xlsx');

       
    };

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
        

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

        
       
        var dateFROM = "";
        var dateTO = "";

        if(typeof $scope.statsDate.dataAppuntamentoDAL != 'undefined' && $scope.statsDate.dataAppuntamentoDAL){
            dateFROM = $scope.statsDate.dataAppuntamentoDAL.getFullYear() + "-" + ($scope.statsDate.dataAppuntamentoDAL.getMonth()+1) + "-" + $scope.statsDate.dataAppuntamentoDAL.getDate();
        }
        if(typeof $scope.statsDate.dataAppuntamentoAL != 'undefined' && $scope.statsDate.dataAppuntamentoAL){
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