app.controller('luceRecessesCtrl',['$scope', '$http', '$location','alertify','moment', function ( $scope, $http, $location,alertify,moment) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.recessesLuce = {};
    $scope.recessesLuce.searchParam={};
  
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

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

    $http.get('../../utility/province_comuni.json').then((result) => {
       // $scope.recessesLuce.searchParam.provinciaSelected = "";
        $scope.recessesLuce.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.recessesLuce.province.splice(0, 0, ({code:"",comuni:"",nome:""}));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });

    
    if($scope.user.TYPE === 'ADMIN' || $scope.user.TYPE === 'BACK_OFFICE'){
        $scope.recessesLuce.Stati =    [
            {
                "Name":" ",
                "Value":""
            },
            {
                "Name":"ASSEGNATO",
                "Value":"ASSEGNATO"
            },
            {
                "Name":"NON ASSOCIATO",
                "Value":"NON_ASSOCIATO"
            },
            {
                "Name":"NON GESTIRE",
                "Value":"NON_GESTIRE"
            },
            {
                "Name":"PRESO IN CARICO",
                "Value":"PRESO_IN_CARICO"
            },
            {
                "Name":"RESPINTO DA AGENTE",
                "Value":"RESPINTO"
            },
            {
                "Name":"APPUNTAMENTO",
                "Value":"APPUNTAMENTO"
            },
            {
                "Name":"RIENTRO",
                "Value":"RIENTRO"
            }
            
        ];
    }else if($scope.user.TYPE === 'RESPONSABILE_AGENTI'){
        $scope.recessesLuce.Stati =    [
            {
                "Name":" ",
                "Value":""
            },
            {
                "Name":"ASSEGNATO",
                "Value":"ASSEGNATO"
            },
            {
                "Name":"PRESO IN CARICO",
                "Value":"PRESO_IN_CARICO"
            },
            {
                "Name":"RESPINTO DA AGENTE",
                "Value":"RESPINTO"
            },
            {
                "Name":"RIENTRO",
                "Value":"RIENTRO"
            }
        ];
    }else if($scope.user.TYPE === 'AGENTE' || $scope.user.TYPE === 'AGENTE_JUNIOR' ){
        $scope.recessesLuce.Stati =    [
            {
                "Name":" ",
                "Value":""
            },
            {
                "Name":"ASSEGNATO",
                "Value":"ASSEGNATO"
            },
            {
                "Name":"PRESO IN CARICO",
                "Value":"PRESO_IN_CARICO"
            }
        ];
    }else if($scope.user.TYPE === 'OPERATORE'){
        $scope.recessesLuce.Stati =    [
            {
                "Name":" ",
                "Value":""
            },
            {
                "Name":"RESPINTO DA AGENTE",
                "Value":"RESPINTO"
            },
            {
                "Name":"APPUNTAMENTO",
                "Value":"APPUNTAMENTO"
            }
        ];
    }
  

 
    $scope.recessesLuce.searchParam.stato={};

   

    $scope.recessesLuce.URLluceRecessesList = "luceRecessesList";

    $scope.recessesLuce.searchParam.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
       

      
        
        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI E ELIMINATI LOGICAMENTE
        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWSrecessi').then((result) => {
            $scope.recessesLuce.agenti =  result.data.agenti;
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });




    }else if( $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        $scope.recessesLuce.venditoreSelected = $scope.user.Id;

        $http.get('/listaAgentiForResponsabile/'+$scope.user.Id).then((result) => {
            $scope.recessesLuce.venditoriForResponsabili = result.data.utenti;
           
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
                $scope.recessesLuce.venditoriForResponsabili = [];
            });
        
    }
    else if( $scope.user.TYPE == "AGENTE" || $scope.user.TYPE === 'AGENTE_JUNIOR'){
        
        $scope.recessesLuce.searchParam.venditoreSelected = $scope.user.Id;
        
    }

    $scope.recessesLuce.showRisultati = false;
    //PAGINATION START
   
    $scope.recessesLuce.searchParam.currentPage = 1;
    $scope.recessesLuce.searchParam.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.recessesLuce.searchParam.startQuery = ($scope.recessesLuce.searchParam.currentPage - 1) * $scope.recessesLuce.searchParam.itemsPerPage;
        $scope.recessesLuce.submitrecessesLuce("pageChanged");
    };
  
    /* $scope.recessesLuce.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.recessesLuce.searchParam = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.recessesLuce.searchParam.venditoreSelected){
            $scope.recessesLuce.searchParam.venditoreSelected = parseInt($scope.recessesLuce.searchParam.venditoreSelected);
        }
        if($scope.recessesLuce.searchParam.operatoriSelected){
            $scope.recessesLuce.searchParam.operatoriSelected = parseInt($scope.recessesLuce.searchParam.operatoriSelected);
        }
        if($scope.recessesLuce.searchParam.dataAppuntamentoDAL){
            $scope.recessesLuce.searchParam.dataAppuntamentoDAL = new Date($scope.recessesLuce.searchParam.dataAppuntamentoDAL);
        }
        if($scope.recessesLuce.searchParam.dataAppuntamentoAL){
            $scope.recessesLuce.searchParam.dataAppuntamentoAL = new Date($scope.recessesLuce.searchParam.dataAppuntamentoAL);
        }     
    }
 */


    //PAGINATION END


    // SEARCH AND ORDER BY kwhAnnui
    $scope.recessesLuce.searchParam.order = ''

    $scope.recessesLuce.searchParam.orderByConsumo=function(){
        
        if($scope.recessesLuce.searchParam.order == ''){
            $scope.recessesLuce.searchParam.order = 'DESC';
        }else if($scope.recessesLuce.searchParam.order == 'DESC'){
            $scope.recessesLuce.searchParam.order = 'ASC';
        }else if($scope.recessesLuce.searchParam.order == 'ASC'){
            $scope.recessesLuce.searchParam.order = '';
        }
        // RESETTO L'OFFSET E LA PAGINAZIONE
        $scope.recessesLuce.submitrecessesLuce('submit');
    }




    $scope.recessesLuce.submitrecessesLuce = function(pageChangedOrSubmit){
        
        

        if(pageChangedOrSubmit === 'submit'){
            $scope.recessesLuce.searchParam.currentPage = 1;
        }
            
        $scope.recessesLuce.searchParam.startQuery = ($scope.recessesLuce.searchParam.currentPage - 1) * $scope.recessesLuce.searchParam.itemsPerPage;

       /*  //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.recessesLuce.searchParam) ); */

         //SALVO I PARAMETRI DI RICERCA END


         // UTILE PER FAR VISUALIZZARE SOLO I RECESSI DEL RESPONSABILE O DEI RELATIVI AGENTI SELEZIOANTI
        var agente = '';
        if(($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI" || $scope.user.TYPE === 'AGENTE_JUNIOR') && !$scope.recessesLuce.searchParam.venditoreSelected){
           agente = $scope.user.Id;
        }else{
            agente =  $scope.recessesLuce.searchParam.venditoreSelected;
        }


        // UTILE PER FAR VISUALIZZARE SOLO I RECESSI DEL RESPONSABILE O DEI RELATIVI AGENTI SELEZIOANTI
        $http.post($scope.recessesLuce.URLluceRecessesList,{
            'limit' :$scope.recessesLuce.searchParam.itemsPerPage,
            'offset':$scope.recessesLuce.searchParam.startQuery,
            'order':$scope.recessesLuce.searchParam.order,
            'dataRecessoDAL': $scope.recessesLuce.searchParam.dataRecessoDAL,
            'dataRecessoAL': $scope.recessesLuce.searchParam.dataRecessoAL,
            'provincia': $scope.recessesLuce.searchParam.provinciaSelected,
            'ragioneSociale':$scope.recessesLuce.searchParam.ragioneSociale,
            'kwhAnnui':$scope.recessesLuce.searchParam.kwhAnnui,
            'stato': $scope.recessesLuce.searchParam.stato.value,
            'agente': agente,
            'userType':$scope.user.TYPE
            

        }).then((result) => {

            if(result.data.recessiLuce.length == 0){
                
                $scope.recessesLuce.showRisultati = false;
                alertify.alert("Nessun RecessiLuce trovato per i parametri selezionati");
            }else{
                $scope.recessesLuce.totalItems = parseInt(result.data.totaleRecessiLuce);
                $scope.recessesLuce.recessiLuceResult = result.data.recessiLuce;
                $scope.recessesLuce.showRisultati = true;
                
            }
           
        }).catch((err) => {

            
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            if(err.status === 500){
                alertify.alert("Errore nella ricerca RecessiLuce");
            }
            
         
        });
    
    
    }

  /*   //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
    if(localStorage.getItem("searchParam")){
        $scope.recessesLuce.submitrecessesLuce("pageChanged");
    } */
   


    $scope.recessesLuce.permanenza = function (dateOUT,dateIN){
        var a = moment(dateIN);
        var b = moment(dateOUT);

        var years = a.diff(b, 'year');
        b.add(years, 'years');

        var months = a.diff(b, 'months');
        b.add(months, 'months');
        var permanenza = '';
        if(years>0){
            permanenza += years + (years>1?' anni ':' anno ');
        }
        if(months>0){
            permanenza += months + (months>1?' mesi ':' mese ');
        }
        if(permanenza == ''){
            permanenza = 'meno di un mese';
        }
        return permanenza;
    }


    $scope.$on('$viewContentLoaded', function() {
        $scope.recessesLuce.submitrecessesLuce('submit');
    });

    $scope.recessesLuce.dettaglioRecesso = {};

    $scope.recessesLuce.modifyRecess = function(recesso){
        $scope.recessesLuce.dettaglioRecesso = Object.assign({},recesso);
        $scope.recessesLuce.dettaglioRecesso.STATO_DA_INVIARE = $scope.recessesLuce.dettaglioRecesso.STATO;
        $('#recessModal').modal('show');
    }

    $scope.recessesLuce.cancel = function () {
        $('#recessModal').modal('hide');
    };

    $scope.recessesLuce.updateRecesso = function () {
        $http.patch('/luceRecess/'+$scope.recessesLuce.dettaglioRecesso.ID_DETTAGLIO_LUCE, {
            'agente': $scope.recessesLuce.dettaglioRecesso.ID_VENDITORE,
            'refRecesso':$scope.recessesLuce.dettaglioRecesso.REFERENTE_RECESSO,
            'refRecapito':$scope.recessesLuce.dettaglioRecesso.REFERENTE_RECESSO_RECAPITO,
            'codContratto': $scope.recessesLuce.dettaglioRecesso.COD_CONTRATTO,
            'stato': $scope.recessesLuce.dettaglioRecesso.STATO_DA_INVIARE,
            'note': $scope.recessesLuce.dettaglioRecesso.NOTE,

         }).then((result) => {
             alertify.alert('Recesso modificato correttamente');
             $scope.recessesLuce.submitrecessesLuce();
             $('#recessModal').modal('hide');
         }).catch((err) => {
             if(err.status === 500){
                 alertify.alert("Errore nella modifica del Recesso");
             }
             if(err.status === 403){
                 alertify.alert("Utente non autorizzato");
                 $location.path('/logout');
             }
         });
    };

}]);