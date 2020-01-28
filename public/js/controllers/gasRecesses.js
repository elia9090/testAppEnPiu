app.controller('gasRecessesCtrl',['$scope', '$http', '$location','alertify','moment', function ( $scope, $http, $location,alertify,moment) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.recessesGas = {};
    $scope.recessesGas.searchParam={};
  
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
       // $scope.recessesGas.searchParam.provinciaSelected = "";
        $scope.recessesGas.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.recessesGas.province.splice(0, 0, ({code:"",comuni:"",nome:""}));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });

    
    if($scope.user.TYPE === 'ADMIN' || $scope.user.TYPE === 'BACK_OFFICE'){
        $scope.recessesGas.Stati =    [
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
            }
            
        ];
    }else{
        $scope.recessesGas.Stati =    [
            {
                "Name":"ASSEGNATO",
                "Value":"ASSEGNATO"
            }
        ];
    }
  

 
    $scope.recessesGas.searchParam.stato={};

   

    $scope.recessesGas.URLgasRecessesList = "gasRecessesList";

    $scope.recessesGas.searchParam.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
       

      
        
        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI E ELIMINATI LOGICAMENTE
        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWS').then((result) => {
            $scope.recessesGas.agenti =  result.data.agenti;
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });




    }else if( $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        $scope.recessesGas.venditoreSelected = $scope.user.Id;

        $http.get('/listaAgentiForResponsabile/'+$scope.user.Id).then((result) => {
            $scope.recessesGas.venditoriForResponsabili = result.data.utenti;
           
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
                $scope.recessesGas.venditoriForResponsabili = [];
            });
        
    }
    else if( $scope.user.TYPE == "AGENTE"){
        
        $scope.recessesGas.searchParam.venditoreSelected = $scope.user.Id;
        
    }

    $scope.recessesGas.showRisultati = false;
    //PAGINATION START
   
    $scope.recessesGas.searchParam.currentPage = 1;
    $scope.recessesGas.searchParam.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.recessesGas.searchParam.startQuery = ($scope.recessesGas.searchParam.currentPage - 1) * $scope.recessesGas.searchParam.itemsPerPage;
        $scope.recessesGas.submitRecessesGas("pageChanged");
    };
  
    /* $scope.recessesGas.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.recessesGas.searchParam = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.recessesGas.searchParam.venditoreSelected){
            $scope.recessesGas.searchParam.venditoreSelected = parseInt($scope.recessesGas.searchParam.venditoreSelected);
        }
        if($scope.recessesGas.searchParam.operatoriSelected){
            $scope.recessesGas.searchParam.operatoriSelected = parseInt($scope.recessesGas.searchParam.operatoriSelected);
        }
        if($scope.recessesGas.searchParam.dataAppuntamentoDAL){
            $scope.recessesGas.searchParam.dataAppuntamentoDAL = new Date($scope.recessesGas.searchParam.dataAppuntamentoDAL);
        }
        if($scope.recessesGas.searchParam.dataAppuntamentoAL){
            $scope.recessesGas.searchParam.dataAppuntamentoAL = new Date($scope.recessesGas.searchParam.dataAppuntamentoAL);
        }     
    }
 */


    //PAGINATION END

    $scope.recessesGas.submitRecessesGas = function(pageChangedOrSubmit){
        
        $.blockUI();

        if(pageChangedOrSubmit === 'submit'){
            $scope.recessesGas.searchParam.currentPage = 1;
        }
            
        $scope.recessesGas.searchParam.startQuery = ($scope.recessesGas.searchParam.currentPage - 1) * $scope.recessesGas.searchParam.itemsPerPage;

       /*  //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.recessesGas.searchParam) ); */

         //SALVO I PARAMETRI DI RICERCA END

        $http.post($scope.recessesGas.URLgasRecessesList,{
            'limit' :$scope.recessesGas.searchParam.itemsPerPage,
            'offset':$scope.recessesGas.searchParam.startQuery,
            'dateFROM': $scope.recessesGas.searchParam.dataRecessoDAL,
            'dateTO': $scope.recessesGas.searchParam.dataRecessoAL,
            'provincia': $scope.recessesGas.searchParam.provinciaSelected,
            'ragioneSociale':$scope.recessesGas.searchParam.ragioneSociale,
            'stato': $scope.recessesGas.searchParam.stato.value,
            'agente': $scope.recessesGas.searchParam.venditoreSelected,
            

        }).then((result) => {

            if(result.data.recessiGas.length == 0){
                $.unblockUI();
                $scope.recessesGas.showRisultati = false;
                alertify.alert("Nessun RecessiGas trovato per i parametri selezionati");
            }else{
                $scope.recessesGas.totalItems = parseInt(result.data.totaleRecessiGas);
                $scope.recessesGas.recessiGasResult = result.data.recessiGas;
                $scope.recessesGas.showRisultati = true;
                $.unblockUI();
            }
           
        }).catch((err) => {

            $.unblockUI();
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            if(err.status === 500){
                alertify.alert("Errore nella ricerca RecessiGas");
            }
            
         
        });
    
    
    }

  /*   //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
    if(localStorage.getItem("searchParam")){
        $scope.recessesGas.submitRecessesGas("pageChanged");
    } */
   

    $scope.recessesGas.viewDate = function (id) {
        $location.path('/viewDate/'+id);
    };

    $scope.recessesGas.modifyDate = function (id) {
        if($scope.user.TYPE == "ADMIN"){
            $location.path('/editDateAdmin/'+id);
        }
        else if($scope.user.TYPE == "OPERATORE"){
            $location.path('/editDateOperatore/'+id);
        }
        else if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI"){
            $location.path('/editDateVenditore/'+id);
        }
       
    };

    $scope.recessesGas.permanenza = function (dateOUT,dateIN){
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
        return permanenza;
    }
}]);