app.controller('dateSearchCtrl', function ( $scope, $http, $location,alertify) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.searchDate = {};
  
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
       // $scope.searchDate.provinciaSelected = "";
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
            return el.nome ===  $scope.searchDate.provinciaSelected;
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
    $scope.searchDate.esito={};

   

    $scope.searchDate.URL = "";

    $scope.searchDate.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN"){
       
        $scope.searchDate.URL = '/searchDate';

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
        
        $scope.searchDate.URL = '/searchDate';
        $scope.searchDate.operatoriSelected = $scope.user.Id;

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
        $scope.searchDate.URL = '/searchDateResponsabile';
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
        
        $scope.searchDate.URL = '/searchDate';
        $scope.searchDate.venditoreSelected = $scope.user.Id;
        
    }

    $scope.searchDate.showRisultati = false;
    //PAGINATION START
   
    $scope.searchDate.currentPage = 1;
    $scope.searchDate.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.searchDate.startQuery = ($scope.searchDate.currentPage - 1) * $scope.searchDate.itemsPerPage;
        $scope.searchDate.submitSearchDate("pageChanged");
    };
  
    $scope.searchDate.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.searchDate = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.searchDate.venditoreSelected){
            $scope.searchDate.venditoreSelected = parseInt($scope.searchDate.venditoreSelected);
        }
        if($scope.searchDate.operatoriSelected){
            $scope.searchDate.operatoriSelected = parseInt($scope.searchDate.operatoriSelected);
        }
        if($scope.searchDate.dataAppuntamentoDAL){
            $scope.searchDate.dataAppuntamentoDAL = new Date($scope.searchDate.dataAppuntamentoDAL);
        }
        if($scope.searchDate.dataAppuntamentoAL){
            $scope.searchDate.dataAppuntamentoAL = new Date($scope.searchDate.dataAppuntamentoAL);
        }     
    }



    //PAGINATION END

    $scope.searchDate.submitSearchDate = function(pageChangedOrSubmit){
        
        $.blockUI();

        if(pageChangedOrSubmit === 'submit'){
            $scope.searchDate.currentPage = 1;
        }
            
        $scope.searchDate.startQuery = ($scope.searchDate.currentPage - 1) * $scope.searchDate.itemsPerPage;

        //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.searchDate) );

         //SALVO I PARAMETRI DI RICERCA END

        if($scope.user.TYPE !== "RESPONSABILE_AGENTI"){
        $http.post($scope.searchDate.URL,{
            'limit' :$scope.searchDate.itemsPerPage,
            'offset':$scope.searchDate.startQuery,
            'dateFROM': $scope.searchDate.dataAppuntamentoDAL,
            'dateTO': $scope.searchDate.dataAppuntamentoAL,
            'provincia': $scope.searchDate.provinciaSelected,
            'comune': $scope.searchDate.comuneSelected,
            'ragioneSociale':$scope.searchDate.ragioneSociale,
            'esito': $scope.searchDate.esito.value,
            'codiceLuce': $scope.searchDate.codLuce,
            'codiceGas': $scope.searchDate.codGas,
            'operatore': $scope.searchDate.operatoriSelected,
            'agente': $scope.searchDate.venditoreSelected,

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
        $http.post($scope.searchDate.URL,{
            'limit' :$scope.searchDate.itemsPerPage,
            'offset':$scope.searchDate.startQuery,
            'dateFROM': $scope.searchDate.dataAppuntamentoDAL,
            'dateTO': $scope.searchDate.dataAppuntamentoAL,
            'provincia': $scope.searchDate.provinciaSelected,
            'comune': $scope.searchDate.comuneSelected,
            'ragioneSociale':$scope.searchDate.ragioneSociale,
            'esito': $scope.searchDate.esito.value,
            'codiceLuce': $scope.searchDate.codLuce,
            'codiceGas': $scope.searchDate.codGas,
            'idResponsabile': $scope.searchDate.idResponsabile,
            'agente': $scope.searchDate.venditoreSelected,

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
});