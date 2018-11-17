app.controller('verifyDateCtrl',['$scope', '$http', '$location','alertify', function ( $scope, $http, $location,alertify) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.verifyDate = {};
  
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
       // $scope.verifyDate.provinciaSelected = "";
        $scope.verifyDate.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.verifyDate.province.splice(0, 0, ({code:"",comuni:"",nome:""}));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.verifyDate.comuniPerProvincia = "";

    $scope.verifyDate.disabledComuni = true;
    
    $scope.verifyDate.showComuni = function(){
        var newArray = $scope.verifyDate.province.filter(function (el) {
            return el.nome ===  $scope.verifyDate.provinciaSelected;
          });
        $scope.verifyDate.comuniPerProvincia = newArray[0].comuni;
        $scope.verifyDate.comuniPerProvincia.splice(0, 0, ({code:"",comuni:"",nome:""}));
        $scope.verifyDate.disabledComuni = false;
    }
    


   

    $scope.verifyDate.URLverifyDate = "";

    $scope.verifyDate.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN"){
       
        $scope.verifyDate.URLverifyDate = '/verifyDate';

    
        
        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI E ELIMINATI LOGICAMENTE
        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWS').then((result) => {
            $scope.verifyDate.agenti =  result.data.agenti;
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });




    }

    $scope.verifyDate.showRisultati = false;
    //PAGINATION START
   
    $scope.verifyDate.currentPage = 1;
    $scope.verifyDate.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.verifyDate.startQuery = ($scope.verifyDate.currentPage - 1) * $scope.verifyDate.itemsPerPage;
        $scope.verifyDate.submitverifyDate("pageChanged");
    };
  
    $scope.verifyDate.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.verifyDate = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.verifyDate.venditoreSelected){
            $scope.verifyDate.venditoreSelected = parseInt($scope.verifyDate.venditoreSelected);
        }
       
        if($scope.verifyDate.dataAppuntamentoDAL){
            $scope.verifyDate.dataAppuntamentoDAL = new Date($scope.verifyDate.dataAppuntamentoDAL);
        }
        if($scope.verifyDate.dataAppuntamentoAL){
            $scope.verifyDate.dataAppuntamentoAL = new Date($scope.verifyDate.dataAppuntamentoAL);
        }     
    }



    //PAGINATION END

    $scope.verifyDate.submitverifyDate = function(pageChangedOrSubmit){
        
        $.blockUI();

        if(pageChangedOrSubmit === 'submit'){
            $scope.verifyDate.currentPage = 1;
        }
            
        $scope.verifyDate.startQuery = ($scope.verifyDate.currentPage - 1) * $scope.verifyDate.itemsPerPage;

        //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.verifyDate) );

         //SALVO I PARAMETRI DI RICERCA END

    
        $http.post($scope.verifyDate.URLverifyDate,{
            'limit' :$scope.verifyDate.itemsPerPage,
            'offset':$scope.verifyDate.startQuery,
            'dateFROM': $scope.verifyDate.dataAppuntamentoDAL,
            'dateTO': $scope.verifyDate.dataAppuntamentoAL,
            'provincia': $scope.verifyDate.provinciaSelected,
            'comune': $scope.verifyDate.comuneSelected,
            'agente': $scope.verifyDate.venditoreSelected

        }).then((result) => {

            if(result.data.appuntamenti.length == 0){
                $.unblockUI();
                $scope.verifyDate.showRisultati = false;
                alertify.alert("Nessun appuntamento trovato per i parametri selezionati");
            }else{
                $scope.verifyDate.totalItems = parseInt(result.data.totaleAppuntamenti);
                $scope.verifyDate.dateList = result.data.appuntamenti;
                $scope.verifyDate.showRisultati = true;
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

    //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
    if(localStorage.getItem("searchParam")){
        $scope.verifyDate.submitverifyDate("pageChanged");
    }
   

    $scope.verifyDate.viewDate = function (id) {
        $location.path('/viewDate/'+id);
    };


}]);