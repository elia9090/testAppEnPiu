
app.controller('nuovoAppuntamentoCtrl',[ '$scope', '$http', '$location',  '$routeParams','$route', 'alertify', function ( $scope, $http, $location,$routeParams , $route, alertify) {
    
    $scope.user = JSON.parse(sessionStorage.user);
    // CREO LO SCOPE PER IL CONTROLLER DEL FORM altrimenti con ng-if crea uno scope child e non prende il valore assegnato
    $scope.newDate ={};
    
    if($scope.user.TYPE !== "ADMIN" && $scope.user.TYPE !== "OPERATORE"){
        $location.path('/dashboard');
    }


    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    //DATEPICKER
    $scope.newDate.dateOptions = {
        minDate: new Date(),
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
      $scope.newDate.altInputFormats = ['M!/d!/yyyy'];
    $scope.newDate.format="dd/MM/yyyy";

    $scope.newDate.open = function() {
        $scope.newDate.popup.opened = true;
    };
    $scope.newDate.popup = {
        opened: false
    };

    //TIMEPICKER
    $scope.newDate.hstep = 1;
    $scope.newDate.mstep = 15;
    //setto come default l'orario alle 14:00
    var dateTime = new Date();
    dateTime.setHours(14);
    dateTime.setMinutes(00);
    
    $scope.newDate.oraAppuntamento=dateTime;
    if($scope.user.TYPE == "OPERATORE"){
        //variabile utile per il submit START
        $scope.newDate.operatoriSelected = $scope.user.Id;
        //variabile utile per il submit END

        $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
        
            $scope.newDate.venditoriForOperatore = result.data.agenti;
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alertify.alert("Impossibile reperire la lista degli agenti associati");
            });
           
    }

    if($scope.user.TYPE == "ADMIN"){

        $scope.newDate.disabledListaAgenti = true;
        
        $http.get('/listaOperatoriWS').then((result) => {
            $scope.newDate.operatori =  result.data.operatori;
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli operatori");
        });
        
        
        $scope.newDate.showAgentiForOperatore = function(idOperatore){
            //variabile utile per il submit START
            $scope.newDate.operatoriSelected = idOperatore;
            //variabile utile per il submit END
            $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
                $scope.newDate.venditoriForOperatore = result.data.agenti;
                $scope.newDate.disabledListaAgenti = false;
                }).catch((err) => {
                    if(err.status === 403){
                        alertify.alert("Utente non autorizzato");
                        $location.path('/logout');
                        return;
                    }
                    alertify.alert("L'operatore selezionato non ha agenti associati");
                    $scope.newDate.disabledListaAgenti = true;
                    $scope.newDate.venditoriForOperatore = "";
                });
           
        }
        
    }
  

   
    $http.get('../../utility/province_comuni.json').then((result) => {
        $scope.newDate.provinciaSelected = "";
        $scope.newDate.province = result.data.province;
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.newDate.comuniPerProvincia = "";
    $scope.newDate.disabledComuni = true;
    //CHECK DOPPIO APPUNTAMENTO
    $scope.newDate.disabledNomeAttivita = true;
    $scope.newDate.oldDateForProvince = [];

    $scope.newDate.showComuniAndLoadCompanyNameForProvince = function(){
        
        

        var newArray = $scope.newDate.province.filter(function (el) {
            return el.nome ===  $scope.newDate.provinciaSelected;
          });

        $scope.newDate.comuniPerProvincia = newArray[0].comuni;
        $scope.newDate.disabledComuni = false;

       

        //SVUTO LE VARIABILI IN CASO DI CAMBIO PROVINCIA
        $scope.newDate.filterOldDateForProvince = [];
        $scope.newDate.nomeAttivita = "";
        $scope.newDate.oldDateForProvince = [];
        
        //chiamo il servizio che mi restituisce la lista dei nomi azienda e l'id appuntamento
        
        $http.get('/listaNomiAziendaAndIdAppunamentoForProvincia/'+$scope.newDate.provinciaSelected).then((result) => {
            $scope.newDate.oldDateForProvince = result.data.listaAziendaAndIdAppuntamento;
            $scope.newDate.disabledNomeAttivita = false;
            
            }).catch((err) => {
                if(err.status === 403){
                    
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                
               
                $scope.newDate.disabledNomeAttivita = false;
            });
        

        
      

    }

	$scope.newDate.completeNomeAttivita=function(string){
        if(!string){
            $scope.newDate.filterOldDateForProvince = [];
            return;
        }
        var output=[];
        angular.forEach($scope.newDate.oldDateForProvince,function(e){
            if(e.NOME_ATTIVITA.toLowerCase().indexOf(string.toLowerCase())>=0){
                output.push(e);
            }
        });
        $scope.newDate.filterOldDateForProvince=output;
    }

    //apro l'appuntamento
    $scope.newDate.Appuntamento = {};

    $scope.newDate.viewDateInModal=function(idAppuntamento){
        
        

        $http.get('/appuntamento/'+idAppuntamento).then((result) => {

            $scope.newDate.Appuntamento =  result.data.appuntamento;
            if($scope.newDate.Appuntamento.ESITO !== null 
                && $scope.newDate.Appuntamento.ESITO !== " " 
                    && $scope.newDate.Appuntamento.ESITO !== "")
                    {
                        $scope.newDate.hasEsito = true;

                    }else{
                        $scope.newDate.hasEsito = false;
                    }
        
        if($scope.newDate.Appuntamento.ESITO == 'OK'){
            $scope.newDate.hasEsito_OK = true;
        }else{
            $scope.newDate.hasEsito_OK = false;
        }
            $('#exampleModal').modal('show');
            
    
        }).catch((err) => {
            if(err.status === 403){
            
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            
            alertify.alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
        });
    }



    // ATTUALE GESTORE START
    $scope.newDate.Groups = "";

    $http.get('../../utility/gestori.json').then((result) => {
       $scope.newDate.Groups = result.data.GESTORI;
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei gestori");
    });

    $scope.newDate.inserisciNuovoGestore = function (newValue) {
        var obj = {};
        obj.Name = newValue;
        obj.Value = newValue;
        $scope.newDate.Groups.push(obj);
        $scope.newDate.group.value = obj.Value;
        $scope.newDate.newValue = '';
    }

  
    $scope.newDate.group = {
        name: "",
        value:""
    }    
// ATTUALE GESTORE END



//ORARIO DA DEFINIRE

$scope.newDate.setOrarioDaDefinire = function(){
    if($scope.newDate.oraDaDefinire){
        var dateTime = new Date();
        dateTime.setHours(00);
        dateTime.setMinutes(01);
        $scope.newDate.oraAppuntamento = dateTime;
    }else{
        var dateTime = new Date();
        dateTime.setHours(14);
        dateTime.setMinutes(00);
        $scope.newDate.oraAppuntamento = dateTime;
    }
}


// invio form 

$scope.newDate.submitNewDate = function(){
    //prendo la data dal timePicker
    var oraAppuntamento = $scope.newDate.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[0] + ":" + $scope.newDate.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[1];
    //parsing della data per il DB
    var dataAppuntamento = $scope.newDate.dataAppuntamento;
    dataAppuntamento = dataAppuntamento.getFullYear() +"-"+ (dataAppuntamento.getMonth()+1) + "-" +dataAppuntamento.getDate();
    //prendo l'id Operatore o dalla session o dalla select
    var idOperatore;
    if($scope.user.TYPE == "OPERATORE"){
        idOperatore =  $scope.user.Id;
    }else{
        idOperatore = $scope.newDate.operatoriSelected;
    }

    $http.post('/addNewDate', {
       'dataAppuntamento':dataAppuntamento ,
       'oraAppuntamento': oraAppuntamento.trim(),
       'provincia': $scope.newDate.provinciaSelected,
       'comune': $scope.newDate.comuneSelected,
       'indirizzo': $scope.newDate.indirizzo,
       'idOperatore': idOperatore,
       'idAgente': $scope.newDate.venditoreSelected,
       'nomeAttivita': $scope.newDate.nomeAttivita,
       'gestoreAttuale': $scope.newDate.group.value,
       'recapiti': $scope.newDate.recapiti,
       'noteOperatore': $scope.newDate.noteOperatore,
    }).then((result) => {
        alertify.alert('Appuntamento creato correttamente');
        $scope.newDate={};
        $location.path("/nuovoAppuntamento");
    }).catch((err) => {
        if(err.status === 500){
            alertify.alert("Errore nella registrazione appuntamento");
        }
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
        }
    });
}

var idAppuntamentoRicontatto = $routeParams.idAppuntamentoRicontatto;
if(idAppuntamentoRicontatto){
    $http.get('/appuntamento/'+idAppuntamentoRicontatto).then((result) => {

        $scope.newDate.AppuntamentoRicontatto =  result.data.appuntamento;
        $scope.newDate.indirizzo = $scope.newDate.AppuntamentoRicontatto.INDIRIZZO;
        $scope.newDate.nomeAttivitaRicontatto = $scope.newDate.AppuntamentoRicontatto.NOME_ATTIVITA;
        $scope.newDate.provinciaSelectedRicontatto = $scope.newDate.AppuntamentoRicontatto.PROVINCIA;
        $scope.newDate.comuneSelectedRicontatto = $scope.newDate.AppuntamentoRicontatto.COMUNE;
        $scope.newDate.recapiti = $scope.newDate.AppuntamentoRicontatto.RECAPITI;
        
    

    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        console.log(err);
        alertify.alert("Impossibile reperire l'appuntamento: "+idAppuntamentoRicontatto);
    });
}


}]);