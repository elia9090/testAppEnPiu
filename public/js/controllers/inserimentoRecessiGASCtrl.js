app.controller('inserimentoRecessiGASCtrl',['$scope', '$http', '$location', 'alertify','$route', function ( $scope, $http, $location, alertify, $route) {
   
    $scope.user = JSON.parse(sessionStorage.user);
  
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.insertRecessesGAS = {};
    $scope.insertRecessesGAS.jsonGas= [];

    $scope.insertRecessesGAS.venditori = {};

    $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
        $scope.insertRecessesGAS.venditori = result.data.agenti;
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
        });

        $scope.insertRecessesGAS.changeAgente = function(x,index){
            $scope.insertRecessesGAS.jsonGas[index].VENDITORE_ASSEGNATO = parseInt(x.VENDITORE_ASSEGNATO);
           
            
        }
    

    $scope.insertRecessesGAS.caricaRecessi = function() {


        if(document.getElementById("excelGas").files.length == 0){
                alertify.alert("Nessun file selezionato");
                return;
            }
        $.blockUI();
       
        var files = document.getElementById("excelGas").files;
        //svuoto il precedente
        $scope.insertRecessesGAS.jsonGas= [];
        
        var i,f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
           var reader = new FileReader();

           reader.onload = function(e) {
               var data = e.target.result;
       
               var workbook = XLSX.read(data, {type: 'binary'});
               var sheet_name_list = workbook.SheetNames;
                 var jsonGas= XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false, defval:null});
                 // rimuovo i caratteri speciali e gli spazi con _
                jsonGas.map( item => {
                    //associo al record dell'excel il relativo id utente proveniente dalle API
                    var agente = _.find($scope.insertRecessesGAS.venditori, function(o) { 
                        var nomeCognomeFoglioExcel = item.AGENTE.toLowerCase().replace(/\s/g, "");
                        var nomeCognomeFromApi = o.COGNOME.toLowerCase().replace(/\s/g, "")+o.NOME.toLowerCase().replace(/\s/g, "");
                        return nomeCognomeFoglioExcel == nomeCognomeFromApi; 
                    });
                    if(agente){
                         //associo al record dell'excel il relativo id utente proveniente dalle API
                        item.VENDITORE_ASSEGNATO = agente.ID_UTENTE;
                    }else{
                        item.VENDITORE_ASSEGNATO = null;
                    }

                    item["DATA INIZIO FORNITURA"] = new Date(item["DATA INIZIO FORNITURA"]);
                    item["DATA OUT"] = new Date(item["DATA OUT"]);
                    $scope.insertRecessesGAS.jsonGas.push(
                        _.mapKeys( item, ( value, key ) => {
                            var newKey = key.trim();
                            newKey = newKey.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
                            newKey = newKey.replace(/\s/g, "_");
                            return newKey;
                        })
                    )
                });
                
               
                setTimeout(function(){ 
                    $scope.insertRecessesGAS.showRisultati = true;
                    $scope.$digest(); 
                    $.unblockUI();
                },1500);
           };
           reader.readAsBinaryString(f);
       }
       
       }

       
       $scope.insertRecessesGAS.inserisciRecessi = function() {
           
        if(document.getElementsByClassName("error-rosso").length > 0){
            alertify.alert('Attenzione - Ci sono recessi da gestire');
            return;
        }
       

        $http.post('/insertRecessesGas', {
            'jsonGas': $scope.insertRecessesGAS.jsonGas
            
         }).then((result) => {
             alertify.alert('Recessi Gas inseriti correttamente');
             $route.reload();
         }).catch((err) => {
             if(err.status === 500){
                 alertify.alert("Errore nell'inserimento dei recessi");
             }
             if(err.status === 400){
                alertify.alert("Bad Request JsonGas non popolato");
            }
             if(err.status === 403){
                 alertify.alert("Utente non autorizzato");
                 $location.path('/logout');
             }
         });
       }

}]);
