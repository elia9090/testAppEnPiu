app.controller('dateSearchCtrl', function ( $scope, $http, $location,$routeParams,$route) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.searchDate = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

     //DATEPICKER
  
      $scope.searchDate.dateOptions = {
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
      $scope.searchDate.altInputFormats = ['M!/d!/yyyy'];
    $scope.searchDate.format="dd/MM/yyyy";

    $scope.searchDate.openDAL = function() {
        $scope.searchDate.popupDAL.opened = true;
    };
    $scope.searchDate.popupDAL = {
        opened: false
    };
    $scope.searchDate.openAL = function() {
        $scope.searchDate.popupAL.opened = true;
    };
    $scope.searchDate.popupAL = {
        opened: false
    };

    $http.get('../../utility/province_comuni.json').then((result) => {
        $scope.searchDate.provinciaSelected = "";
        $scope.searchDate.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.searchDate.province.splice(0, 0, ({code:"",comuni:"",nome:""}));
    }).catch((err) => {
        alert("Impossibile reperire la lista dei comuni");
    });
    $scope.searchDate.comuniPerProvincia = "";
    $scope.searchDate.disabledComuni = true;
    
    $scope.searchDate.showComuni = function(){
        var newArray = $scope.searchDate.province.filter(function (el) {
            return el.nome ===  $scope.searchDate.provinciaSelected;
          });
        $scope.searchDate.comuniPerProvincia = newArray[0].comuni;
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
            "Name":" ",
            "Value":""
        }
        
    ];
    $scope.searchDate.esito={};

   

    $scope.searchDate.URL = "";

    $scope.searchDate.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN"){
       
        $scope.searchDate.URL = '/searchDateAdmin';

        //LISTA OPERATORI
        $http.get('/listaOperatoriWS').then((result) => {
            $scope.searchDate.operatori =  result.data.operatori;
           
        }).catch((err) => {
            if(err.status === 403){
                alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alert("Impossibile reperire la lista degli operatori");
        });
        
        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI
        $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
            $scope.searchDate.agenti =  result.data.agenti;
         
            
        }).catch((err) => {
            if(err.status === 403){
                alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alert("Impossibile reperire la lista degli agenti");
        });




    }else if($scope.user.TYPE == "OPERATORE"){
        
        $scope.searchDate.URL = '/searchDateOperatore';
        $scope.searchDate.operatoriSelected = $scope.user.Id;

        $http.get('/listaUtentiForOperatore/'+$scope.user.Id).then((result) => {
            $scope.searchDate.venditoriForOperatore = result.data.utenti;
           
            }).catch((err) => {
                if(err.status === 403){
                    alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
                $scope.searchDate.venditoriForOperatore = "NESSUN AGENTE ASSOCIATO";
            });
        
    }else if( $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        $scope.searchDate.URL = '/searchDateResponsabileAgenti';

        
    }
    else if( $scope.user.TYPE == "AGENTE"){
        
        $scope.searchDate.URL = '/searchDateeAgenti';
        $scope.searchDate.venditoreSelected = $scope.user.Id
        
    }

    $scope.searchDate.showRisultati = false;
    //PAGINATION START
   
    $scope.searchDate.currentPage = 1;
    $scope.searchDate.itemsPerPage = 5;

    $scope.searchDate.pageChanged = function() {
        $scope.searchDate.startQuery = ($scope.searchDate.currentPage - 1) * $scope.searchDate.itemsPerPage;
        $scope.searchDate.submitSearchDate();
    };
  
    $scope.searchDate.startQuery = ($scope.searchDate.currentPage - 1) * $scope.searchDate.itemsPerPage;
    
    //PAGINATION END

    $scope.searchDate.submitSearchDate = function(){
        
        $.blockUI();
        
        if($scope.searchDate.dataAppuntamentoDAL !== undefined){
            var dataAppuntamentoFROM = $scope.searchDate.dataAppuntamentoDAL;
            dataAppuntamentoFROM = dataAppuntamentoFROM.getFullYear() +"-"+ (dataAppuntamentoFROM.getMonth()+1) + "-" +dataAppuntamentoFROM.getDate();    
        }
       
        if($scope.searchDate.dataAppuntamentoDAL !== undefined){
            var dataAppuntamentoTO = $scope.searchDate.dataAppuntamentoAL;
            dataAppuntamentoTO = dataAppuntamentoTO.getFullYear() +"-"+ (dataAppuntamentoTO.getMonth()+1) + "-" +dataAppuntamentoTO.getDate();
    
        }
        
        $http.post($scope.searchDate.URL,{
            'limit' :$scope.searchDate.itemsPerPage,
            'offset':$scope.searchDate.startQuery,
            'dateFROM': dataAppuntamentoFROM,
            'dateTO': dataAppuntamentoTO,
            'provincia': $scope.searchDate.provinciaSelected,
            'comune': $scope.searchDate.comuneSelected,
            'esito': $scope.searchDate.esito.value,
            'codiceLuce': $scope.searchDate.codLuce,
            'codiceGas': $scope.searchDate.codGas,
            'operatore': $scope.searchDate.operatoriSelected,
            'agente': $scope.searchDate.venditoreSelected,

        }).then((result) => {
            $scope.searchDate.totalItems = parseInt(result.data.totaleAppuntamenti);
            $scope.searchDate.dateList = result.data.appuntamenti;
            $scope.searchDate.showRisultati = true;
            $.unblockUI();
        }).catch((err) => {

            $.unblockUI();
            if(err.status === 403){
                alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alert("Errore nella ricerca appuntamenti");
        });
    
    }
   

});