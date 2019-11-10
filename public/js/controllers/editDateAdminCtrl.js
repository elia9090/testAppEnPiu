app.controller('editDateAdminCtrl',['$scope', '$http', '$location','$routeParams','$route', 'alertify', function ( $scope, $http, $location,$routeParams,$route, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $scope.editDateAdmin = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.id;
    
    $scope.editDateAdmin.Appuntamento = {};
   
    $http.get('/appuntamento/'+idAppuntamento).then((result) => {
        //prendo l'appuntamento
        $scope.editDateAdmin.Appuntamento =  result.data.appuntamento;
        //setto data e ora START
        var ora = parseInt($scope.editDateAdmin.Appuntamento.ORA_APPUNTAMENTO.split(":")[0]);
        var minuti = parseInt($scope.editDateAdmin.Appuntamento.ORA_APPUNTAMENTO.split(":")[1]);
        var dateTime = new Date();
        dateTime.setHours(ora);
        dateTime.setMinutes(minuti);
        $scope.editDateAdmin.oraAppuntamento=dateTime;
        //CONTROLLO SE L'ORARIO E' DA DEFINIRE se lo è setto a true la checkbox
        if($scope.editDateAdmin.Appuntamento.ORA_APPUNTAMENTO == '00:01'){
            $scope.editDateAdmin.oraDaDefinire = true;
        }
        $scope.editDateAdmin.dataAppuntamento = new Date($scope.editDateAdmin.Appuntamento.DATA_APPUNTAMENTO);
        //setto data e ora END

        // PRENDO IL LUOGO E L'INDIRIZZO START 
        $scope.editDateAdmin.provinciaSelected = $scope.editDateAdmin.Appuntamento.PROVINCIA;
        $scope.editDateAdmin.comuneSelected = $scope.editDateAdmin.Appuntamento.COMUNE;
        $scope.editDateAdmin.indirizzo = $scope.editDateAdmin.Appuntamento.INDIRIZZO;
       

        //NOTE AGENTE 
        $scope.editDateAdmin.noteAgente = $scope.editDateAdmin.Appuntamento.NOTE_AGENTE;
        
        
    $http.get('../../utility/province_comuni.json').then((result) => {
        
        $scope.editDateAdmin.province = result.data.province;
        $scope.editDateAdmin.showComuni();
       
        
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.editDateAdmin.comuniPerProvincia = "";
    $scope.editDateAdmin.disabledComuni = false;
        // PRENDO IL LUOGO E L'INDIRIZZO END 


    // OPERATORI AGENTI START 
    $scope.editDateAdmin.operatoriSelected = $scope.editDateAdmin.Appuntamento.ID_OPERATORE;
    
    $http.get('/listaOperatoriWS').then((result) => {
        $scope.editDateAdmin.operatori =  result.data.operatori;

        $scope.editDateAdmin.showAgentiForOperatore = function(idOperatore){
            //variabile utile per il submit START
            $scope.editDateAdmin.operatoriSelected = idOperatore;
            //variabile utile per il submit END
            $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
                $scope.editDateAdmin.venditoriForOperatore = result.data.agenti;
                $scope.editDateAdmin.disabledListaAgenti = false;
                $scope.editDateAdmin.venditoreSelected = $scope.editDateAdmin.Appuntamento.ID_VENDITORE;
                }).catch((err) => {
                    if(err.status === 403){
                        alertify.alert("Utente non autorizzato");
                        $location.path('/logout');
                        return;
                    }
                    alertify.alert("L'operatore selezionato non ha agenti associati");
                    $scope.editDateAdmin.disabledListaAgenti = true;
                    $scope.editDateAdmin.venditoriForOperatore = "";
                });
           
        }
        $scope.editDateAdmin.showAgentiForOperatore($scope.editDateAdmin.operatoriSelected);
        
    }).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire la lista degli operatori");
    });
    
    
    
   
    // OPERATORI AGENTI END

// INFO FINALI start

$scope.editDateAdmin.nomeAttivita = $scope.editDateAdmin.Appuntamento.NOME_ATTIVITA;
$scope.editDateAdmin.recapiti = $scope.editDateAdmin.Appuntamento.RECAPITI;
$scope.editDateAdmin.noteOperatore = $scope.editDateAdmin.Appuntamento.NOTE_OPERATORE;

//POPOLO GAS E LUCE START
if($scope.editDateAdmin.Appuntamento.CODICI_CONTRATTO_LUCE==null){
    $scope.editDateAdmin.inputsLuce=[];
}
else{
 $scope.editDateAdmin.inputsLuce=$scope.editDateAdmin.Appuntamento.CODICI_CONTRATTO_LUCE.split(';');
}

if($scope.editDateAdmin.Appuntamento.CODICI_CONTRATTO_GAS==null){
    $scope.editDateAdmin.inputsGas=[];
}
else{
 $scope.editDateAdmin.inputsGas=$scope.editDateAdmin.Appuntamento.CODICI_CONTRATTO_GAS.split(';');
}

 $scope.editDateAdmin.numLuce=$scope.editDateAdmin.Appuntamento.NUM_LUCE;
 $scope.editDateAdmin.numGas=$scope.editDateAdmin.Appuntamento.NUM_GAS;
//POPOLO GAS E LUCE END
 $scope.editDateAdmin.esito={};
 $scope.editDateAdmin.esito.value=$scope.editDateAdmin.Appuntamento.ESITO;
// INFO FINALI end

// ATTUALE GESTORE START
$scope.editDateAdmin.Groups = "";

$http.get('../../utility/gestori.json').then((result) => {
   $scope.editDateAdmin.Groups = result.data.GESTORI;
   $scope.editDateAdmin.inserisciNuovoGestore($scope.editDateAdmin.Appuntamento.ATTUALE_GESTORE);

}).catch((err) => {
    alertify.alert("Impossibile reperire la lista dei gestori");
});

$scope.editDateAdmin.inserisciNuovoGestore = function (newValue) {
    var obj = {};
    obj.Name = newValue;
    obj.Value = newValue;
    $scope.editDateAdmin.Groups.push(obj);
    $scope.editDateAdmin.group.value = obj.Value;
    $scope.editDateAdmin.newValue = '';
}


$scope.editDateAdmin.group = {
    name: "",
    value:""
}    
// ATTUALE GESTORE END


// ESITO APPUNTAMENTO 

$scope.editDateAdmin.Esiti =    [
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
        "Value":" "
    }
    
];

$scope.editDateAdmin.numeri = function (){
    for(var i = 0; i<100 ; i++){
        $scope.editDateAdmin.numeriContratto.push(i);
    }
}

$scope.editDateAdmin.numeriContratto = [];
 
$scope.editDateAdmin.numeri();


$scope.editDateAdmin.createInputLuce = function (){
    var luceLength=$scope.editDateAdmin.inputsLuce.length;
    //$scope.editDateAdmin.inputsLuce = [];
    
    var inputNumbers = Math.floor(parseInt($scope.editDateAdmin.numLuce) / 3);
    if(parseInt($scope.editDateAdmin.numLuce) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    var diff=inputNumbers-luceLength;
    if (diff>=0){
    for(var i = 0; i<diff; i++){
       
        $scope.editDateAdmin.inputsLuce.push('');
    }
}else{
    for(var i = 0; i<-diff; i++){
        
        $scope.editDateAdmin.inputsLuce.pop();
    }

}
}


$scope.editDateAdmin.createInputGas = function (){
    var gasLength=$scope.editDateAdmin.inputsGas.length;

    var inputNumbers = Math.floor(parseInt($scope.editDateAdmin.numGas) / 3);
    
    if(parseInt($scope.editDateAdmin.numGas) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    var diff=inputNumbers-gasLength;
    if (diff>=0){
    for(var i = 0; i<diff; i++){
        
        $scope.editDateAdmin.inputsGas.push('');
    }
}else{
    for(var i = 0; i<-diff; i++){
        
        $scope.editDateAdmin.inputsGas.pop();
    }
}
}
//aggiungo eventuali codici contrattto non obbligatori
$scope.editDateAdmin.inputsLuceAdded = [];
$scope.editDateAdmin.addNewNumContrattoLuce = function(){
    $scope.editDateAdmin.inputsLuceAdded.push('');
}
$scope.editDateAdmin.removeNewNumContrattoLuce = function(){
    $scope.editDateAdmin.inputsLuceAdded.pop();
}
$scope.editDateAdmin.inputsGasAdded = [];
$scope.editDateAdmin.addNewNumContrattoGas = function(){
    $scope.editDateAdmin.inputsGasAdded.push('');
}
$scope.editDateAdmin.removeNewNumContrattoGas = function(){
    $scope.editDateAdmin.inputsGasAdded.pop();
}
//fine then getAppuntamento
}).catch((err) => {
        if(err.status === 403){
            alertify.alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alertify.alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
        $location.path('/listaAppuntamenti');
    });
   
    $scope.editDateAdmin.dateOptions = {
        minDate: new Date(),
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
    $scope.editDateAdmin.altInputFormats = ['M!/d!/yyyy'];
    $scope.editDateAdmin.format="dd/MM/yyyy";

    $scope.editDateAdmin.open = function() {
        $scope.editDateAdmin.popup.opened = true;
    };
    $scope.editDateAdmin.popup = {
        opened: false
    };

    //TIMEPICKER
    $scope.editDateAdmin.hstep = 1;
    $scope.editDateAdmin.mstep = 15;


    //ORARIO DA DEFINIRE

    $scope.editDateAdmin.setOrarioDaDefinire = function(){
        if($scope.editDateAdmin.oraDaDefinire){
            var dateTime = new Date();
            dateTime.setHours(00);
            dateTime.setMinutes(01);
            $scope.editDateAdmin.oraAppuntamento = dateTime;
        }else{
            var dateTime = new Date();
            dateTime.setHours(14);
            dateTime.setMinutes(00);
            $scope.editDateAdmin.oraAppuntamento = dateTime;
        }
    }
   
  
         
    $scope.editDateAdmin.showComuni = function(){
        newArray = $scope.editDateAdmin.province.filter(function (el) {
            return el.nome ===  $scope.editDateAdmin.provinciaSelected;
        });
        $scope.editDateAdmin.comuniPerProvincia = newArray[0].comuni;
        $scope.editDateAdmin.disabledComuni = false;
    }


    $scope.editDateAdmin.submitDateAdmin = function(){
          
        //prendo la data dal timePicker
            var oraAppuntamento = $scope.editDateAdmin.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[0] + ":" + $scope.editDateAdmin.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[1];
            //parsing della data per il DB
            var dataAppuntamento = $scope.editDateAdmin.dataAppuntamento;
            dataAppuntamento = dataAppuntamento.getFullYear() +"-"+ (dataAppuntamento.getMonth()+1) + "-" +dataAppuntamento.getDate();
         

            //aggiungo gli inputLuce e input gas in piu agli obbligatori

            for(var i=0; i<$scope.editDateAdmin.inputsLuceAdded.length; i++){
                $scope.editDateAdmin.inputsLuce.push($scope.editDateAdmin.inputsLuceAdded[i]);
            }
            for(var i=0; i<$scope.editDateAdmin.inputsGasAdded.length; i++){
                $scope.editDateAdmin.inputsGas.push($scope.editDateAdmin.inputsGasAdded[i]);
            }

            var setterClousureDate = "";
            if($scope.editDateAdmin.Appuntamento 
                 && $scope.editDateAdmin.Appuntamento.ESITO != 'OK' && $scope.editDateAdmin.esito.value != null
                  && $scope.editDateAdmin.esito.value == 'OK'){
                setterClousureDate = "OK";
            }

            if($scope.editDateAdmin.esito.value != null
                && typeof $scope.editDateAdmin.esito.value != undefined
                && $scope.editDateAdmin.esito.value == 'KO' 
                && ($scope.editDateAdmin.noteAgente == null 
                || typeof $scope.editDateAdmin.noteAgente == undefined
                || $scope.editDateAdmin.noteAgente.trim().length < 10)){
                    alertify.alert('Inserire una nota agente esplicativa in caso di KO');
                    return;
                }

            $http.post('/editDateAdmin', {
                'idAppuntamento' :  $scope.editDateAdmin.Appuntamento.ID_APPUNTAMENTO,
                'dataAppuntamento':dataAppuntamento ,
                'oraAppuntamento': oraAppuntamento.trim(),
                'provincia': $scope.editDateAdmin.provinciaSelected,
                'comune': $scope.editDateAdmin.comuneSelected,
                'indirizzo': $scope.editDateAdmin.indirizzo,
                'idOperatore': $scope.editDateAdmin.operatoriSelected,
                'idAgente': $scope.editDateAdmin.venditoreSelected,
                'nomeAttivita': $scope.editDateAdmin.nomeAttivita,
                'gestoreAttuale': $scope.editDateAdmin.group.value,
                'recapiti': $scope.editDateAdmin.recapiti,
                'noteOperatore': $scope.editDateAdmin.noteOperatore,
                'esitoAppuntamento': $scope.editDateAdmin.esito.value,
                'numLuce' : $scope.editDateAdmin.numLuce,
                'numGas' : $scope.editDateAdmin.numGas,
                'codici_contratto_gas': $scope.editDateAdmin.inputsGas.join(";"),
                'codici_contratto_luce': $scope.editDateAdmin.inputsLuce.join(";"),
                'noteAgente' : $scope.editDateAdmin.noteAgente,
                'data_ok' : setterClousureDate
    
             }).then((result) => {
                 alertify.alert('Appuntamento modificato correttamente');
                 $route.reload();
             }).catch((err) => {
                 if(err.status === 500){
                     alertify.alert("Errore nella modifica appuntamento");
                 }
                 if(err.status === 403){
                     alertify.alert("Utente non autorizzato");
                     $location.path('/logout');
                 }
             });
    
        }


        $scope.editDateAdmin.deleteDate = function(){
            alertify.confirm("Vuoi eliminare l'appuntamento "+$scope.editDateAdmin.Appuntamento.ID_APPUNTAMENTO+"?", function(){ 
                $http.post('/deleteDate', {
                    
                    'id': $scope.editDateAdmin.Appuntamento.ID_APPUNTAMENTO
                
        
                }).then((result) => {
                    alertify.alert('Appuntamento eliminato');
                    window.history.back();
                }).catch((err) => {
                    if(err.status === 500){
                        alertify.alert("Impossibile cancellare l'appuntamento");
                    }
                    else if(err.status === 403){
                        alertify.alert("Utente non autorizzato");
                        $location.path('/logout');
                    }
                    else{
                        alertify.alert("Impossibile cancellare l'appuntamento");
                    }

                });
                });
            
        }
    
        $scope.editDateAdmin.cancel = function () {
            window.history.back();
        };
}]);