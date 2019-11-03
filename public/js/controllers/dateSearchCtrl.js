app.controller('dateSearchCtrl',['$scope', '$http', '$location','alertify', function ( $scope, $http, $location,alertify) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.searchDate = {};
    $scope.searchDate.searchParam={};
  
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
       // $scope.searchDate.searchParam.provinciaSelected = "";
        $scope.searchDate.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.searchDate.province.splice(0, 0, ({code:"",comuni:"",nome:""}));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.searchDate.comuniPerProvincia = "";

    $scope.searchDate.disabledComuni = true;
    
    $scope.searchDate.showComuni = function(){
        var newArray = $scope.searchDate.province.filter(function (el) {
            return el.nome ===  $scope.searchDate.searchParam.provinciaSelected;
          });
        $scope.searchDate.comuniPerProvincia = newArray[0].comuni;
        $scope.searchDate.comuniPerProvincia.splice(0, 0, ({code:"",comuni:"",nome:""}));
        $scope.searchDate.disabledComuni = false;
    }
    

    $scope.searchDate.Esiti =    [
        {
            "Name":"KO",
            "Value":"KO"
        },
        {
            "Name":"VALUTA",
            "Value":"VALUTA"
        },
        {
            "Name":"ASSENTE",
            "Value":"ASSENTE"
        },
        {
            "Name":"OK",
            "Value":"OK"
        },
        {
            "Name":"NON VISITATO",
            "Value":"NON VISITATO"
        },
        {
            "Name":"NON ESITATO",
            "Value":"NON ESITATO"
        },
        {
            "Name":" ",
            "Value":""
        }
        
    ];
    $scope.searchDate.searchParam.esito={};

   

    $scope.searchDate.URLsearchDate = "";

    $scope.searchDate.searchParam.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
       
        $scope.searchDate.URLsearchDate = '/searchDate';

        //LISTA OPERATORI
        $http.get('/listaOperatoriWS').then((result) => {
            $scope.searchDate.operatori =  result.data.operatori;
            
           
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
            $scope.searchDate.agenti =  result.data.agenti;
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });




    }else if($scope.user.TYPE == "OPERATORE"){
        
        $scope.searchDate.URLsearchDate = '/searchDate';
        $scope.searchDate.searchParam.operatoriSelected = $scope.user.Id;

        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWS').then((result) => {
            $scope.searchDate.venditoriForOperatore = result.data.agenti;
           
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
                $scope.searchDate.venditoriForOperatore = [];
            });
        
    }else if( $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        $scope.searchDate.URLsearchDate = '/searchDateResponsabile';
        $scope.searchDate.idResponsabile = $scope.user.Id;

        $http.get('/listaAgentiForResponsabile/'+$scope.user.Id).then((result) => {
            $scope.searchDate.venditoriForResponsabili = result.data.utenti;
           
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
                $scope.searchDate.venditoriForResponsabili = [];
            });
        
    }
    else if( $scope.user.TYPE == "AGENTE"){
        
        $scope.searchDate.URLsearchDate = '/searchDate';
        $scope.searchDate.searchParam.venditoreSelected = $scope.user.Id;
        
    }

    $scope.searchDate.showRisultati = false;
    //PAGINATION START
   
    $scope.searchDate.searchParam.currentPage = 1;
    $scope.searchDate.searchParam.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.searchDate.searchParam.startQuery = ($scope.searchDate.searchParam.currentPage - 1) * $scope.searchDate.searchParam.itemsPerPage;
        $scope.searchDate.submitSearchDate("pageChanged");
    };
  
    $scope.searchDate.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.searchDate.searchParam = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.searchDate.searchParam.venditoreSelected){
            $scope.searchDate.searchParam.venditoreSelected = parseInt($scope.searchDate.searchParam.venditoreSelected);
        }
        if($scope.searchDate.searchParam.operatoriSelected){
            $scope.searchDate.searchParam.operatoriSelected = parseInt($scope.searchDate.searchParam.operatoriSelected);
        }
        if($scope.searchDate.searchParam.dataAppuntamentoDAL){
            $scope.searchDate.searchParam.dataAppuntamentoDAL = new Date($scope.searchDate.searchParam.dataAppuntamentoDAL);
        }
        if($scope.searchDate.searchParam.dataAppuntamentoAL){
            $scope.searchDate.searchParam.dataAppuntamentoAL = new Date($scope.searchDate.searchParam.dataAppuntamentoAL);
        }     
    }



    //PAGINATION END

    $scope.searchDate.submitSearchDate = function(pageChangedOrSubmit){
        
        $.blockUI();

        if(pageChangedOrSubmit === 'submit'){
            $scope.searchDate.searchParam.currentPage = 1;
        }
            
        $scope.searchDate.searchParam.startQuery = ($scope.searchDate.searchParam.currentPage - 1) * $scope.searchDate.searchParam.itemsPerPage;

        //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.searchDate.searchParam) );

         //SALVO I PARAMETRI DI RICERCA END

        if($scope.user.TYPE !== "RESPONSABILE_AGENTI"){
        $http.post($scope.searchDate.URLsearchDate,{
            'limit' :$scope.searchDate.searchParam.itemsPerPage,
            'offset':$scope.searchDate.searchParam.startQuery,
            'dateFROM': $scope.searchDate.searchParam.dataAppuntamentoDAL,
            'dateTO': $scope.searchDate.searchParam.dataAppuntamentoAL,
            'provincia': $scope.searchDate.searchParam.provinciaSelected,
            'comune': $scope.searchDate.searchParam.comuneSelected,
            'ragioneSociale':$scope.searchDate.searchParam.ragioneSociale,
            'esito': $scope.searchDate.searchParam.esito.value,
            'codiceLuce': $scope.searchDate.searchParam.codLuce,
            'codiceGas': $scope.searchDate.searchParam.codGas,
            'operatore': $scope.searchDate.searchParam.operatoriSelected,
            'agente': $scope.searchDate.searchParam.venditoreSelected,

        }).then((result) => {

            if(result.data.appuntamenti.length == 0){
                $.unblockUI();
                $scope.searchDate.showRisultati = false;
                alertify.alert("Nessun appuntamento trovato per i parametri selezionati");
            }else{
                $scope.searchDate.totalItems = parseInt(result.data.totaleAppuntamenti);
                $scope.searchDate.dateList = result.data.appuntamenti;
                $scope.searchDate.showRisultati = true;
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
                alertify.alert("Errore nella ricerca appuntamenti");
            }
            
         
        });
    }else{
        $http.post($scope.searchDate.URLsearchDate,{
            'limit' :$scope.searchDate.searchParam.itemsPerPage,
            'offset':$scope.searchDate.searchParam.startQuery,
            'dateFROM': $scope.searchDate.searchParam.dataAppuntamentoDAL,
            'dateTO': $scope.searchDate.searchParam.dataAppuntamentoAL,
            'provincia': $scope.searchDate.searchParam.provinciaSelected,
            'comune': $scope.searchDate.searchParam.comuneSelected,
            'ragioneSociale':$scope.searchDate.searchParam.ragioneSociale,
            'esito': $scope.searchDate.searchParam.esito.value,
            'codiceLuce': $scope.searchDate.searchParam.codLuce,
            'codiceGas': $scope.searchDate.searchParam.codGas,
            'idResponsabile': $scope.searchDate.idResponsabile,
            'agente': $scope.searchDate.searchParam.venditoreSelected,

        }).then((result) => {

            if(result.data.appuntamenti.length == 0){
                $.unblockUI();
                $scope.searchDate.showRisultati = false;
                alertify.alert("Nessun appuntamento trovato per i parametri selezionati");
            }else{
                $scope.searchDate.totalItems = parseInt(result.data.totaleAppuntamenti);
                $scope.searchDate.dateList = result.data.appuntamenti;
                $scope.searchDate.showRisultati = true;
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
                alertify.alert("Errore nella ricerca appuntamenti");
            }
            
         
        });
    }
    
    }

    //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
    if(localStorage.getItem("searchParam")){
        $scope.searchDate.submitSearchDate("pageChanged");
    }
   

    $scope.searchDate.viewDate = function (id) {
        $location.path('/viewDate/'+id);
    };

    $scope.searchDate.modifyDate = function (id) {
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
}]);