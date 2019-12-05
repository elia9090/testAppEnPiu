app.controller('inserimentoRecessiLUCECtrl',['$scope', '$http', '$location', 'alertify', function ( $scope, $http, $location, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
  
    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

    $scope.insertRecessesLUCE = {};
    
    $scope.insertRecessesLUCE.jsonLuce = {};

    $scope.insertRecessesLUCE.venditori = {};

    $http.get('/listaAgentiNoRelationWithOperatorWS').then((result) => {
        $scope.insertRecessesLUCE.venditori = result.data.agenti;
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
        });

    $scope.insertRecessesLUCE.caricaRecessi = function() {


        if(document.getElementById("excelLuce").files.length == 0){
                alertify.alert("Nessun file selezionato");
                return;
            }
        $.blockUI();
       
        var files = document.getElementById("excelLuce").files;
        
        var i,f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
           var reader = new FileReader();

           reader.onload = function(e) {
               var data = e.target.result;
       
               var workbook = XLSX.read(data, {type: 'binary'});
               var sheet_name_list = workbook.SheetNames;
                $scope.insertRecessesLUCE.jsonLuce = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false, defval:null});
                $scope.insertRecessesLUCE.showRisultati = true;
                $scope.$digest();
                $.unblockUI();
           };
           reader.readAsBinaryString(f);
       }
       
       }

}]);
