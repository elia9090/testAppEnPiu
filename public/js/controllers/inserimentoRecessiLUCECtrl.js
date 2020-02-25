app.controller('inserimentoRecessiLUCECtrl',['$scope', '$http', '$location', 'alertify','$route', function ( $scope, $http, $location, alertify,$route) {
   
    $scope.user = JSON.parse(sessionStorage.user);
  
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.insertRecessesLUCE = {};
    
    $scope.insertRecessesLUCE.jsonLuce = [];

    $scope.insertRecessesLUCE.venditori = {};

    $http.get('/listaAgentiNoRelationWithOperatorWSrecessi').then((result) => {
        $scope.insertRecessesLUCE.venditori = result.data.agenti;
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
        });

     
    $scope.insertRecessesLUCE.changeAgente = function(x,index){
        $scope.insertRecessesLUCE.jsonLuce[index].VENDITORE_ASSEGNATO = parseInt(x.VENDITORE_ASSEGNATO);
       
        
    }

    $scope.insertRecessesLUCE.caricaRecessi = function() {


        if(document.getElementById("excelLuce").files.length == 0){
                alertify.alert("Nessun file selezionato");
                return;
            }
        $.blockUI();
       
        var files = document.getElementById("excelLuce").files;
        //svuoto il prcedente
        $scope.insertRecessesLUCE.jsonLuce = [];

        var i,f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
           var reader = new FileReader();

           reader.onload = function(e) {
               var data = e.target.result;
       
               var workbook = XLSX.read(data, {type: 'binary'});
               var sheet_name_list = workbook.SheetNames;
                var jsonLuce = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false, defval:null});
                // rimuovo i caratteri speciali e gli spazi con _
                jsonLuce.map( item => {
                    //associo al record dell'excel il relativo id utente proveniente dalle API
                    var agente = _.find($scope.insertRecessesLUCE.venditori, function(o) { 
                        var nomeCognomeFoglioExcel = item.AGENZIA.toLowerCase().replace(/\s/g, "");
                        var nomeCognomeFromApi = o.COGNOME.toLowerCase().replace(/\s/g, "")+o.NOME.toLowerCase().replace(/\s/g, "");
                        return nomeCognomeFoglioExcel == nomeCognomeFromApi; 
                    });
                    if(agente){
                         //associo al record dell'excel il relativo id utente proveniente dalle API
                        item.VENDITORE_ASSEGNATO = agente.ID_UTENTE;
                    }else{
                        item.VENDITORE_ASSEGNATO = null;
                    }
                    
                    item.DATA_ATTIVAZIONE = new Date(item.DATA_ATTIVAZIONE);
                    item.DATA_VALIDITA_RECESSO = new Date(item.DATA_VALIDITA_RECESSO);

                    $scope.insertRecessesLUCE.jsonLuce.push(
                        _.mapKeys( item, ( value, key ) => {
                            // NEL FOGLIO RECESSI LUCE NON C'E' BISOGNO DI fare operazioni nell'header
                            // IL FILE ARRIVA GIA' SENZA CARATTERI SPECIALI E SENZA SPAZI MA CON GLI UNDERSCORE
                            var newKey = key.trim();
                            newKey = newKey.replace(/\s/g, "_");
                            return newKey;
                        })
                        
                    )
                });

                setTimeout(function(){ 
                    $scope.insertRecessesLUCE.showRisultati = true;
                    $scope.$digest(); 
                    $.unblockUI();
                },1500);
               
           };
           reader.readAsBinaryString(f);
       }
       
       }

       $scope.insertRecessesLUCE.inserisciRecessi = function() {

        if(document.getElementsByClassName("error-rosso").length > 0){
            alertify.alert('Attenzione - Ci sono recessi da gestire');
            return;
        }

        $http.post('/insertRecessesLuce', {
            'jsonLuce': $scope.insertRecessesLUCE.jsonLuce
            
         }).then((result) => {
             alertify.alert('Recessi luce inseriti correttamente');
             $route.reload();
         }).catch((err) => {
             if(err.status === 500){
                 alertify.alert("Errore nell'inserimento dei recessi");
             }
             if(err.status === 400){
                alertify.alert("Bad Request JsonLuce non popolato");
            }
             if(err.status === 403){
                 alertify.alert("Utente non autorizzato");
                 $location.path('/logout');
             }
         });
       }

}]);
