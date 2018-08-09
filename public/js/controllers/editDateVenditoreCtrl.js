app.controller('editDateVenditoreCtrl', function ($scope, $http, $location,$routeParams,$route, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $scope.editDateVenditore = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    
    var idAppuntamento = $routeParams.id;
    
    $scope.editDateVenditore.Appuntamento = {};

    $http.get('/appuntamento/'+idAppuntamento).then((result) => {
        //prendo l'appuntamento
        $scope.editDateVenditore.Appuntamento =  result.data.appuntamento;
        //setto data e ora START
   
    
    
         //NOTE AGENTE 
         $scope.editDateVenditore.noteAgente = $scope.editDateVenditore.Appuntamento.NOTE_AGENTE;


//POPOLO GAS E LUCE START
if($scope.editDateVenditore.Appuntamento.CODICI_CONTRATTO_LUCE==null){
    $scope.editDateVenditore.inputsLuce=[];
}
else{
 $scope.editDateVenditore.inputsLuce=$scope.editDateVenditore.Appuntamento.CODICI_CONTRATTO_LUCE.split(';');
}

if($scope.editDateVenditore.Appuntamento.CODICI_CONTRATTO_GAS==null){
    $scope.editDateVenditore.inputsGas=[];
}
else{
 $scope.editDateVenditore.inputsGas=$scope.editDateVenditore.Appuntamento.CODICI_CONTRATTO_GAS.split(';');
}

 $scope.editDateVenditore.numLuce=$scope.editDateVenditore.Appuntamento.NUM_LUCE;
 $scope.editDateVenditore.numGas=$scope.editDateVenditore.Appuntamento.NUM_GAS;
//POPOLO GAS E LUCE END
 $scope.editDateVenditore.esito={};
 $scope.editDateVenditore.esito.value=$scope.editDateVenditore.Appuntamento.ESITO;
// INFO FINALI end



// ESITO APPUNTAMENTO 

$scope.editDateVenditore.Esiti =    [
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

$scope.editDateVenditore.numeri = function (){
    for(var i = 0; i<100 ; i++){
        $scope.editDateVenditore.numeriContratto.push(i);
    }
}

$scope.editDateVenditore.numeriContratto = [];
 
$scope.editDateVenditore.numeri();


$scope.editDateVenditore.createInputLuce = function (){
    var luceLength=$scope.editDateVenditore.inputsLuce.length;
    //$scope.editDateVenditore.inputsLuce = [];
    
    var inputNumbers = Math.floor(parseInt($scope.editDateVenditore.numLuce) / 3);
    if(parseInt($scope.editDateVenditore.numLuce) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    var diff=inputNumbers-luceLength;
    if (diff>=0){
    for(var i = 0; i<diff; i++){
       
        $scope.editDateVenditore.inputsLuce.push('');
    }
}else{
    for(var i = 0; i<-diff; i++){
        
        $scope.editDateVenditore.inputsLuce.pop();
    }

}
}
$scope.editDateVenditore.createInputGas = function (){
    var gasLength=$scope.editDateVenditore.inputsGas.length;

    var inputNumbers = Math.floor(parseInt($scope.editDateVenditore.numGas) / 3);
    if(parseInt($scope.editDateVenditore.numGas) % 3 > 0){
        inputNumbers = inputNumbers + 1;
    }
    var diff=inputNumbers-gasLength;
    if (diff>=0){
    for(var i = 0; i<diff; i++){
        
        $scope.editDateVenditore.inputsGas.push('');
    }
}else{
    for(var i = 0; i<-diff; i++){
        
        $scope.editDateVenditore.inputsGas.pop();
    }
}
}
//aggiungo eventuali codici contrattto non obbligatori
$scope.editDateVenditore.inputsLuceAdded = [];
$scope.editDateVenditore.addNewNumContrattoLuce = function(){
    $scope.editDateVenditore.inputsLuceAdded.push('');
}
$scope.editDateVenditore.removeNewNumContrattoLuce = function(){
    $scope.editDateVenditore.inputsLuceAdded.pop();
}
$scope.editDateVenditore.inputsGasAdded = [];
$scope.editDateVenditore.addNewNumContrattoGas = function(){
    $scope.editDateVenditore.inputsGasAdded.push('');
}
$scope.editDateVenditore.removeNewNumContrattoGas = function(){
    $scope.editDateVenditore.inputsGasAdded.pop();
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

    //submit del form
   
    $scope.editDateVenditore.submitDateVenditore = function(){

        //aggiungo gli inputLuce e input gas in piu agli obbligatori
        for(var i=0; i<$scope.editDateVenditore.inputsLuceAdded.length; i++){
            $scope.editDateVenditore.inputsLuce.push($scope.editDateVenditore.inputsLuceAdded[i]);
        }
        for(var i=0; i<$scope.editDateVenditore.inputsGasAdded.length; i++){
            $scope.editDateVenditore.inputsGas.push($scope.editDateVenditore.inputsGasAdded[i]);
        }


        $http.post('/editDateVenditore', {
            'idAppuntamento': $scope.editDateVenditore.Appuntamento.ID_APPUNTAMENTO,
            'esitoAppuntamento': $scope.editDateVenditore.esito.value,
            'numLuce' : $scope.editDateVenditore.numLuce,
            'numGas' : $scope.editDateVenditore.numGas,
            'codici_contratto_gas': $scope.editDateVenditore.inputsGas.join(";"),
            'codici_contratto_luce': $scope.editDateVenditore.inputsLuce.join(";"),
            'noteAgente' : $scope.editDateVenditore.noteAgente
     
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
    $scope.editDateVenditore.cancel = function () {
        window.history.back();
    };
    

});