app.controller('editDateOperatoreCtrl', function ( $scope, $http, $location,$routeParams) {
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
        $scope.editDateOperatore.dataAppuntamento = new Date($scope.editDateOperatore.Appuntamento.DATA_APPUNTAMENTO);
        //setto data e ora END

        // PRENDO IL LUOGO E L'INDIRIZZO START 
        $scope.editDateOperatore.provinciaSelected = $scope.editDateOperatore.Appuntamento.PROVINCIA;
        $scope.editDateOperatore.comuneSelected = $scope.editDateOperatore.Appuntamento.COMUNE;
        $scope.editDateOperatore.indirizzo = $scope.editDateOperatore.Appuntamento.INDIRIZZO;
       
        
    $http.get('../../utility/province_comuni.json').then((result) => {
        
        $scope.editDateOperatore.province = result.data.province;
        $scope.editDateOperatore.showComuni();
       
        
    }).catch((err) => {
        alert("Impossibile reperire la lista dei comuni");
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
        $http.get('/listaUtentiForOperatore/'+idOperatore).then((result) => {
            $scope.editDateOperatore.venditoriForOperatore = result.data.utenti;
            $scope.editDateOperatore.readOnlyListaAgenti = false;
            $scope.editDateOperatore.venditoreSelected = $scope.editDateOperatore.Appuntamento.ID_VENDITORE;
            }).catch((err) => {
                if(err.status === 403){
                    alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alert("L'operatore non ha agenti associati");
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
    alert("Impossibile reperire la lista dei gestori");
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
            alert("Utente non autorizzato");
            $location.path('/logout');
            return;
        }
        alert("Impossibile reperire l'appuntamento: "+idAppuntamento);
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


   
  
         
    $scope.editDateOperatore.showComuni = function(){
        newArray = $scope.editDateOperatore.province.filter(function (el) {
            return el.nome ===  $scope.editDateOperatore.provinciaSelected;
        });
        $scope.editDateOperatore.comuniPerProvincia = newArray[0].comuni;
        $scope.editDateOperatore.disabledComuni = false;
    }
});