app.controller('inserimentoRecessiLUCECtrl',['$scope', '$http', '$location', 'alertify', function ( $scope, $http, $location, alertify) {
   
    $scope.insertRecessesLUCE = {};

    $scope.insertRecessesLUCE.jsonLuce = {};

    $scope.insertRecessesLUCE.caricaRecessi = function() {

        if(document.getElementById("excelLuce").files.length == 0){
                alertify.alert("Nessun file selezionato");
                return;
            }

       
        var files = document.getElementById("excelLuce").files;
        
        var i,f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
           var reader = new FileReader();

           reader.onload = function(e) {
               var data = e.target.result;
       
               var workbook = XLSX.read(data, {type: 'binary'});
               var sheet_name_list = workbook.SheetNames;
                $scope.insertRecessesLUCE.jsonLuce = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false, defval:null});
           };
           reader.readAsBinaryString(f);
       }
       
       }

}]);
