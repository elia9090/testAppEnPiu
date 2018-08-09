app.controller('dateListCtrl', function ( $scope, $http, $location,alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    $scope.dateList = [];
    
    var url = "";

    if($scope.user.TYPE == "ADMIN"){
        url = '/listaAppuntamentiAdmin';
    }else if($scope.user.TYPE == "OPERATORE"){
        url = '/listaAppuntamentiOperatore/'+$scope.user.Id;
    }else if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI"){
        url = '/listaAppuntamentiVenditore/'+$scope.user.Id;
    }



    
    $http.get(url).then((result) => {
    
    if(result.data.error){
        alertify.alert("Nessuno appuntamento trovato");
    }else{
        $scope.dateList = result.data.appuntamenti;
    } 
    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire la lista degli appuntamenti");
    });
  

    $scope.modifyDate = function (id) {
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
    $scope.viewDate = function (id) {
        $location.path('/viewDate/'+id);
    };

    $scope.tdEsitoClass = function (esito) {
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
    
    $scope.today = new Date().getFullYear() +"-"+ (new Date().getMonth()+1) + "-" + new Date().getDate();

    $scope.tdDataClass = function (dataAppuntamento, esito) {
        dataAppuntamento = dataAppuntamento.split("T")[0];
        dataAppuntamento = dataAppuntamento.split("-")
        var anno=parseInt(dataAppuntamento[0]);
        var mese=parseInt(dataAppuntamento[1])-1;
        var giorno=parseInt(dataAppuntamento[2]);
        if((new Date(anno,mese,giorno,0,0,0,0) < new Date($scope.today).setUTCHours(0, 0, 0, 0)) && (esito == null || esito.trim() == '')){
            return 'red-backgroundTR'
        }
        
    };

    $scope.tdDataTodayClass = function (dataAppuntamento) {
        dataAppuntamento = dataAppuntamento.split("T")[0];
        dataAppuntamento = dataAppuntamento.split("-")
        var anno=parseInt(dataAppuntamento[0]);
        var mese=parseInt(dataAppuntamento[1])-1;
        var giorno=parseInt(dataAppuntamento[2]);
        if(new Date(anno,mese,giorno,0,0,0,0) == new Date($scope.today).setUTCHours(0, 0, 0, 0)){
            return 'td-bold '
        }
        
    };


   


});