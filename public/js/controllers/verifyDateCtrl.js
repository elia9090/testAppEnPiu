app.controller('verifyDateCtrl',['$scope', '$http', '$location','alertify', function ( $scope, $http, $location,alertify) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.verifyDate = {};
    $scope.verifyDate.verifyParam={};
  
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
       // $scope.verifyDate.verifyParam.provinciaSelected = "";
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
            return el.nome ===  $scope.verifyDate.verifyParam.provinciaSelected;
          });
        $scope.verifyDate.comuniPerProvincia = newArray[0].comuni;
        $scope.verifyDate.comuniPerProvincia.splice(0, 0, ({code:"",comuni:"",nome:""}));
        $scope.verifyDate.disabledComuni = false;
    }
    


   

    $scope.verifyDate.URLverifyDate = "";

    $scope.verifyDate.verifyParam.venditoreSelected = "";

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
       
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
   
    $scope.verifyDate.verifyParam.currentPage = 1;
    $scope.verifyDate.verifyParam.itemsPerPage = 10;

    $scope.pageChanged = function() {
        $scope.verifyDate.verifyParam.startQuery = ($scope.verifyDate.verifyParam.currentPage - 1) * $scope.verifyDate.verifyParam.itemsPerPage;
        $scope.verifyDate.submitverifyDate("pageChanged");
    };
  
    $scope.verifyDate.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.verifyDate.verifyParam = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.verifyDate.verifyParam.venditoreSelected){
            $scope.verifyDate.verifyParam.venditoreSelected = parseInt($scope.verifyDate.verifyParam.venditoreSelected);
        }
       
        if($scope.verifyDate.verifyParam.dataAppuntamentoDAL){
            $scope.verifyDate.verifyParam.dataAppuntamentoDAL = new Date($scope.verifyDate.verifyParam.dataAppuntamentoDAL);
        }
        if($scope.verifyDate.verifyParam.dataAppuntamentoAL){
            $scope.verifyDate.verifyParam.dataAppuntamentoAL = new Date($scope.verifyDate.verifyParam.dataAppuntamentoAL);
        }     
    }



    //PAGINATION END

    $scope.verifyDate.submitverifyDate = function(pageChangedOrSubmit){
        
        

        if(pageChangedOrSubmit === 'submit'){
            $scope.verifyDate.verifyParam.currentPage = 1;
        }
            
        $scope.verifyDate.verifyParam.startQuery = ($scope.verifyDate.verifyParam.currentPage - 1) * $scope.verifyDate.verifyParam.itemsPerPage;

        //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam",angular.toJson($scope.verifyDate.verifyParam) );

         //SALVO I PARAMETRI DI RICERCA END

    
        $http.post($scope.verifyDate.URLverifyDate,{
            'limit' :$scope.verifyDate.verifyParam.itemsPerPage,
            'offset':$scope.verifyDate.verifyParam.startQuery,
            'dateFROM': $scope.verifyDate.verifyParam.dataAppuntamentoDAL,
            'dateTO': $scope.verifyDate.verifyParam.dataAppuntamentoAL,
            'provincia': $scope.verifyDate.verifyParam.provinciaSelected,
            'comune': $scope.verifyDate.verifyParam.comuneSelected,
            'agente': $scope.verifyDate.verifyParam.venditoreSelected

        }).then((result) => {

            if(result.data.appuntamenti.length == 0){
                
                $scope.verifyDate.showRisultati = false;
                alertify.alert("Nessun appuntamento trovato per i parametri selezionati");
            }else{
                $scope.verifyDate.totalItems = parseInt(result.data.totaleAppuntamenti);
                $scope.verifyDate.dateList = result.data.appuntamenti;
                $scope.verifyDate.showRisultati = true;
                
            }
           
        }).catch((err) => {

            
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