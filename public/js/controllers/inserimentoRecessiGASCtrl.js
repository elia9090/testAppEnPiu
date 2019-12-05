app.controller('inserimentoRecessiGASCtrl',['$scope', '$http', '$location', 'alertify', function ( $scope, $http, $location, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
  
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.insertRecessesGAS = {};
    
    $scope.insertRecessesGAS.jsonGas = {};

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

    $scope.insertRecessesGAS.caricaRecessi = function() {


        if(document.getElementById("excelGas").files.length == 0){
                alertify.alert("Nessun file selezionato");
                return;
            }
        $.blockUI();
       
        var files = document.getElementById("excelGas").files;
        
        var i,f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
           var reader = new FileReader();

           reader.onload = function(e) {
               var data = e.target.result;
       
               var workbook = XLSX.read(data, {type: 'binary'});
               var sheet_name_list = workbook.SheetNames;
                $scope.insertRecessesGAS.jsonGas = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false, defval:null});
                $scope.insertRecessesGAS.showRisultati = true;
                $scope.$digest();
                $.unblockUI();
           };
           reader.readAsBinaryString(f);
       }
       
       }

}]);
