app.controller('editDateAdminCtrl', function ( $scope, $http, $location,$routeParams) {
   
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
        $scope.editDateAdmin.dataAppuntamento = new Date($scope.editDateAdmin.Appuntamento.DATA_APPUNTAMENTO);
        //setto data e ora END

        // PRENDO IL LUOGO E L'INDIRIZZO START 
        $scope.editDateAdmin.provinciaSelected = $scope.editDateAdmin.Appuntamento.PROVINCIA;
        $scope.editDateAdmin.comuneSelected = $scope.editDateAdmin.Appuntamento.COMUNE;
        $scope.editDateAdmin.indirizzo = $scope.editDateAdmin.Appuntamento.INDIRIZZO;
        
    $http.get('../../utility/province_comuni.json').then((result) => {
        
        $scope.editDateAdmin.province = result.data.province;
        $scope.editDateAdmin.showComuni();
       
        
    }).catch((err) => {
        alert("Impossibile reperire la lista dei comuni");
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
            $http.get('/listaUtentiForOperatore/'+idOperatore).then((result) => {
                $scope.editDateAdmin.venditoriForOperatore = result.data.utenti;
                $scope.editDateAdmin.disabledListaAgenti = false;
                $scope.editDateAdmin.venditoreSelected = $scope.editDateAdmin.Appuntamento.ID_VENDITORE;
                }).catch((err) => {
                    if(err.status === 403){
                        alert("Utente non autorizzato");
                        $location.path('/logout');
                        return;
                    }
                    alert("L'operatore selezionato non ha agenti associati");
                    $scope.editDateAdmin.disabledListaAgenti = true;
                    $scope.editDateAdmin.venditoriForOperatore = "";
                });
           
        }
        $scope.editDateAdmin.showAgentiForOperatore($scope.editDateAdmin.operatoriSelected);
        
    }).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire la lista degli operatori");
    });
    
    
    
   
    // OPERATORI AGENTI END

// INFO FINALI start

$scope.editDateAdmin.nomeAttivita = $scope.editDateAdmin.Appuntamento.NOME_ATTIVITA;
$scope.editDateAdmin.recapiti = $scope.editDateAdmin.Appuntamento.RECAPITI;
$scope.editDateAdmin.noteOperatore = $scope.editDateAdmin.Appuntamento.NOTE_OPERATORE;

// INFO FINALI end

// ATTUALE GESTORE START
$scope.editDateAdmin.Groups = "";

$http.get('../../utility/gestori.json').then((result) => {
   $scope.editDateAdmin.Groups = result.data.GESTORI;
   $scope.editDateAdmin.inserisciNuovoGestore($scope.editDateAdmin.Appuntamento.ATTUALE_GESTORE);

}).catch((err) => {
    alert("Impossibile reperire la lista dei gestori");
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
    $scope.editDateAdmin.inputsLuce = [];
    
    var inputNumbers = Math.floor(parseInt($scope.editDateAdmin.numLuce) / 3);
    if(parseInt($scope.editDateAdmin.numLuce) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    for(var i = 0; i<inputNumbers; i++){
        var dataObj = {codice:''};
        $scope.editDateAdmin.inputsLuce.push(dataObj);
    }
}
$scope.editDateAdmin.createInputGas = function (){
    
    $scope.editDateAdmin.inputsGas = [];
    var inputNumbers = Math.floor(parseInt($scope.editDateAdmin.numGas) / 3);
    if(parseInt($scope.editDateAdmin.numGas) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    for(var i = 0; i<inputNumbers; i++){
        var dataObj = {codice:''};
        $scope.editDateAdmin.inputsGas.push(dataObj);
    }
}


//fine then getAppuntamento
}).catch((err) => {
        if(err.status === 403){
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
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


   
  
         
    $scope.editDateAdmin.showComuni = function(){
        newArray = $scope.editDateAdmin.province.filter(function (el) {
            return el.nome ===  $scope.editDateAdmin.provinciaSelected;
        });
        $scope.editDateAdmin.comuniPerProvincia = newArray[0].comuni;
        $scope.editDateAdmin.disabledComuni = false;
    }

});