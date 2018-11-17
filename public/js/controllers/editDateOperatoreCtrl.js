app.controller('editDateOperatoreCtrl',['$scope', '$http', '$location','$routeParams','$route', 'alertify', function ($scope, $http, $location,$routeParams,$route, alertify) {
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "OPERATORE"){
        $location.path('/dashboard');
    }

    $scope.editDateOperatore = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.id;

    $scope.editDateOperatore.Appuntamento = {};

    $http.get('/appuntamento/'+idAppuntamento).then((result) => {
    
        //prendo l'appuntamento
        $scope.editDateOperatore.Appuntamento =  result.data.appuntamento;
        //setto data e ora START
        var ora = parseInt($scope.editDateOperatore.Appuntamento.ORA_APPUNTAMENTO.split(":")[0]);
        var minuti = parseInt($scope.editDateOperatore.Appuntamento.ORA_APPUNTAMENTO.split(":")[1]);
        var dateTime = new Date();
        dateTime.setHours(ora);
        dateTime.setMinutes(minuti);
        $scope.editDateOperatore.oraAppuntamento=dateTime;
         //CONTROLLO SE L'ORARIO E' DA DEFINIRE se lo è setto a true la checkbox
         if($scope.editDateOperatore.Appuntamento.ORA_APPUNTAMENTO == '00:01'){
            $scope.editDateOperatore.oraDaDefinire = true;
        }
        $scope.editDateOperatore.dataAppuntamento = new Date($scope.editDateOperatore.Appuntamento.DATA_APPUNTAMENTO);
        //setto data e ora END

        // PRENDO IL LUOGO E L'INDIRIZZO START 
        $scope.editDateOperatore.provinciaSelected = $scope.editDateOperatore.Appuntamento.PROVINCIA;
        $scope.editDateOperatore.comuneSelected = $scope.editDateOperatore.Appuntamento.COMUNE;
        $scope.editDateOperatore.indirizzo = $scope.editDateOperatore.Appuntamento.INDIRIZZO;
       
        //NOTE AGENTE 
        $scope.editDateOperatore.noteAgente = $scope.editDateOperatore.Appuntamento.NOTE_AGENTE;
        
    $http.get('../../utility/province_comuni.json').then((result) => {
        
        $scope.editDateOperatore.province = result.data.province;
        $scope.editDateOperatore.showComuni();
       
        
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.editDateOperatore.comuniPerProvincia = "";
    $scope.editDateOperatore.disabledComuni = false;
        // PRENDO IL LUOGO E L'INDIRIZZO END 


    // OPERATORI AGENTI START 
    $scope.editDateOperatore.operatoriSelected = $scope.editDateOperatore.Appuntamento.ID_OPERATORE;
    
    

    $scope.editDateOperatore.showAgentiForOperatore = function(idOperatore){
        //variabile utile per il submit START
        $scope.editDateOperatore.operatoriSelected = idOperatore;
        //variabile utile per il submit END
        $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
            $scope.editDateOperatore.venditoriForOperatore = result.data.agenti;
            $scope.editDateOperatore.readOnlyListaAgenti = false;
            $scope.editDateOperatore.venditoreSelected = $scope.editDateOperatore.Appuntamento.ID_VENDITORE;
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alertify.alert("L'operatore non ha agenti associati");
                $scope.editDateOperatore.readOnlyListaAgenti = true;
                $scope.editDateOperatore.venditoriForOperatore = "";
            });
        
    }

    $scope.editDateOperatore.showAgentiForOperatore($scope.editDateOperatore.operatoriSelected);
        
    
    
    
    
   
    // OPERATORI AGENTI END

// INFO FINALI start

$scope.editDateOperatore.nomeAttivita = $scope.editDateOperatore.Appuntamento.NOME_ATTIVITA;
$scope.editDateOperatore.recapiti = $scope.editDateOperatore.Appuntamento.RECAPITI;
$scope.editDateOperatore.noteOperatore = $scope.editDateOperatore.Appuntamento.NOTE_OPERATORE;

//POPOLO GAS E LUCE START

 $scope.editDateOperatore.numLuce=$scope.editDateOperatore.Appuntamento.NUM_LUCE;
 $scope.editDateOperatore.numGas=$scope.editDateOperatore.Appuntamento.NUM_GAS;
//POPOLO GAS E LUCE END
 $scope.editDateOperatore.esito={};
 $scope.editDateOperatore.esito.value=$scope.editDateOperatore.Appuntamento.ESITO;
// INFO FINALI end

// ATTUALE GESTORE START
$scope.editDateOperatore.Groups = "";

$http.get('../../utility/gestori.json').then((result) => {
   $scope.editDateOperatore.Groups = result.data.GESTORI;
   $scope.editDateOperatore.inserisciNuovoGestore($scope.editDateOperatore.Appuntamento.ATTUALE_GESTORE);

}).catch((err) => {
    alertify.alert("Impossibile reperire la lista dei gestori");
});

$scope.editDateOperatore.inserisciNuovoGestore = function (newValue) {
    var obj = {};
    obj.Name = newValue;
    obj.Value = newValue;
    $scope.editDateOperatore.Groups.push(obj);
    $scope.editDateOperatore.group.value = obj.Value;
    $scope.editDateOperatore.newValue = '';
}


$scope.editDateOperatore.group = {
    name: "",
    value:""
}    
// ATTUALE GESTORE END


// ESITO APPUNTAMENTO 

$scope.editDateOperatore.Esiti =    [
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
        "Name":"NON VISITATO",
        "Value":"NON VISITATO"
    },
   
    {
        "Name":" ",
        "Value":" "
    }
    
];


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
   
    $scope.editDateOperatore.dateOptions = {
        minDate: new Date(),
        startingDay: 1,
        showWeeks:false,
        placement:"auto bottom-right"
      };
    $scope.editDateOperatore.altInputFormats = ['M!/d!/yyyy'];
    $scope.editDateOperatore.format="dd/MM/yyyy";

    $scope.editDateOperatore.open = function() {
        $scope.editDateOperatore.popup.opened = true;
    };
    $scope.editDateOperatore.popup = {
        opened: false
    };

    //TIMEPICKER
    $scope.editDateOperatore.hstep = 1;
    $scope.editDateOperatore.mstep = 15;

    //ORARIO DA DEFINIRE

    $scope.editDateOperatore.setOrarioDaDefinire = function(){
        if($scope.editDateOperatore.oraDaDefinire){
            var dateTime = new Date();
            dateTime.setHours(00);
            dateTime.setMinutes(01);
            $scope.editDateOperatore.oraAppuntamento = dateTime;
        }else{
            var dateTime = new Date();
            dateTime.setHours(14);
            dateTime.setMinutes(00);
            $scope.editDateOperatore.oraAppuntamento = dateTime;
        }
    }
   
  
         
    $scope.editDateOperatore.showComuni = function(){
        newArray = $scope.editDateOperatore.province.filter(function (el) {
            return el.nome ===  $scope.editDateOperatore.provinciaSelected;
        });
        $scope.editDateOperatore.comuniPerProvincia = newArray[0].comuni;
        $scope.editDateOperatore.disabledComuni = false;
    }



    $scope.editDateOperatore.submitDateOperatore = function (){

            //prendo la data dal timePicker
        var oraAppuntamento = $scope.editDateOperatore.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[0] + ":" + $scope.editDateOperatore.oraAppuntamento.toLocaleString("it-IT").split(",")[1].split(":")[1];
        //parsing della data per il DB
        var dataAppuntamento = $scope.editDateOperatore.dataAppuntamento;
        dataAppuntamento = dataAppuntamento.getFullYear() +"-"+ (dataAppuntamento.getMonth()+1) + "-" +dataAppuntamento.getDate();
        //prendo l'id Operatore o dalla session o dalla select
        var idOperatore;
        if($scope.user.TYPE == "OPERATORE"){
            idOperatore =  $scope.user.Id;
        }else{
            idOperatore = $scope.editDateOperatore.operatoriSelected;
        }

        $http.post('/editDateOperatore', {
            'idAppuntamento' :  $scope.editDateOperatore.Appuntamento.ID_APPUNTAMENTO,
            'dataAppuntamento':dataAppuntamento ,
            'oraAppuntamento': oraAppuntamento.trim(),
            'provincia': $scope.editDateOperatore.provinciaSelected,
            'comune': $scope.editDateOperatore.comuneSelected,
            'indirizzo': $scope.editDateOperatore.indirizzo,
            'idOperatore': idOperatore,
            'idAgente': $scope.editDateOperatore.venditoreSelected,
            'nomeAttivita': $scope.editDateOperatore.nomeAttivita,
            'gestoreAttuale': $scope.editDateOperatore.group.value,
            'recapiti': $scope.editDateOperatore.recapiti,
            'noteOperatore': $scope.editDateOperatore.noteOperatore,
            'esitoAppuntamento': $scope.editDateOperatore.esito.value,
            'noteAgente' : $scope.editDateOperatore.noteAgente

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


    $scope.editDateOperatore.cancel = function () {
        window.history.back();
    };


}]);