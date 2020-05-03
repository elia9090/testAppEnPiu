app.controller('ricontattoAppuntamentiCtrl',['$scope', '$http', '$location', 'alertify', function ($scope, $http, $location, alertify) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   

    $scope.ricontattoAppuntamenti = {};
    $scope.ricontattoAppuntamenti.searchParam = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    

  //DATEPICKER

  $scope.dateOptions = {
    startingDay: 1,
    showWeeks: false,
    placement: "auto bottom-right"
};
$scope.altInputFormats = ['M!/d!/yyyy'];
$scope.format = "dd/MM/yyyy";

$scope.openDAL = function () {
    $scope.popupDAL.opened = true;
};
$scope.popupDAL = {
    opened: false
};
$scope.openAL = function () {
    $scope.popupAL.opened = true;
};
$scope.popupAL = {
    opened: false
};

$http.get('../../utility/province_comuni.json').then((result) => {
    // $scope.ricontattoAppuntamenti.searchParam.provinciaSelected = "";
    $scope.ricontattoAppuntamenti.province = result.data.province;
    //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
    $scope.ricontattoAppuntamenti.province.splice(0, 0, ({ code: "", comuni: "", nome: "" }));
}).catch((err) => {
    alertify.alert("Impossibile reperire la lista dei comuni");
});
$scope.ricontattoAppuntamenti.comuniPerProvincia = "";

$scope.ricontattoAppuntamenti.disabledComuni = true;

$scope.ricontattoAppuntamenti.showComuni = function () {
    var newArray = $scope.ricontattoAppuntamenti.province.filter(function (el) {
        return el.nome === $scope.ricontattoAppuntamenti.searchParam.provinciaSelected;
    });
    $scope.ricontattoAppuntamenti.comuniPerProvincia = newArray[0].comuni;
    $scope.ricontattoAppuntamenti.comuniPerProvincia.splice(0, 0, ({ code: "", comuni: "", nome: "" }));
    $scope.ricontattoAppuntamenti.disabledComuni = false;
}


$scope.ricontattoAppuntamenti.showRisultati = false;
//PAGINATION START

$scope.ricontattoAppuntamenti.searchParam.currentPage = 1;
$scope.ricontattoAppuntamenti.searchParam.itemsPerPage = 10;

$scope.pageChanged = function () {
    $scope.ricontattoAppuntamenti.searchParam.startQuery = ($scope.ricontattoAppuntamenti.searchParam.currentPage - 1) * $scope.ricontattoAppuntamenti.searchParam.itemsPerPage;
    $scope.ricontattoAppuntamenti.submitRicontattoAppuntamenti("pageChanged");
};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if (localStorage.getItem("searchParam")) {
        $scope.ricontattoAppuntamenti.searchParam = angular.fromJson(localStorage.getItem("searchParam"));
       /*  if ($scope.ricontattoAppuntamenti.searchParam.venditoreSelected) {
            $scope.ricontattoAppuntamenti.searchParam.venditoreSelected = parseInt($scope.ricontattoAppuntamenti.searchParam.venditoreSelected);
        }
        if ($scope.ricontattoAppuntamenti.searchParam.operatoriSelected) {
            $scope.ricontattoAppuntamenti.searchParam.operatoriSelected = parseInt($scope.ricontattoAppuntamenti.searchParam.operatoriSelected);
        } */
        if ($scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoDAL) {
            $scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoDAL = new Date($scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoDAL);
        }
        if ($scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoAL) {
            $scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoAL = new Date($scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoAL);
        }
    }


    //PAGINATION END

    $scope.ricontattoAppuntamenti.submitRicontattoAppuntamenti = function (pageChangedOrSubmit) {



        if (pageChangedOrSubmit === 'submit') {
            $scope.ricontattoAppuntamenti.searchParam.currentPage = 1;
        }

        $scope.ricontattoAppuntamenti.searchParam.startQuery = ($scope.ricontattoAppuntamenti.searchParam.currentPage - 1) * $scope.ricontattoAppuntamenti.searchParam.itemsPerPage;

        //SALVO I PARAMETRI DI RICERCA START
        localStorage.removeItem("searchParam");

        localStorage.setItem("searchParam", angular.toJson($scope.ricontattoAppuntamenti.searchParam));

        //SALVO I PARAMETRI DI RICERCA END

            $http.post('/searchDateRicontatto', {
                'limit': $scope.ricontattoAppuntamenti.searchParam.itemsPerPage,
                'offset': $scope.ricontattoAppuntamenti.searchParam.startQuery,
                'dateFROM': $scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoDAL,
                'dateTO': $scope.ricontattoAppuntamenti.searchParam.dataAppuntamentoAL,
                'provincia': $scope.ricontattoAppuntamenti.searchParam.provinciaSelected,
                'comune': $scope.ricontattoAppuntamenti.searchParam.comuneSelected,
                'ragioneSociale': $scope.ricontattoAppuntamenti.searchParam.ragioneSociale
            }).then((result) => {

                if (result.data.appuntamenti.length == 0) {

                    $scope.ricontattoAppuntamenti.showRisultati = false;
                    alertify.alert("Nessun appuntamento trovato per i parametri selezionati");
                } else {
                    $scope.ricontattoAppuntamenti.totalItems = parseInt(result.data.totaleAppuntamenti);
                    $scope.ricontattoAppuntamenti.dateList = result.data.appuntamenti;
                    $scope.ricontattoAppuntamenti.showRisultati = true;

                }

            }).catch((err) => {


                if (err.status === 403) {
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                if (err.status === 500) {
                    alertify.alert("Errore nella ricerca appuntamenti");
                }


            });
        

    }

    //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
    if (localStorage.getItem("searchParam")) {
        $scope.ricontattoAppuntamenti.submitRicontattoAppuntamenti("pageChanged");
    }
    $scope.ricontattoAppuntamenti.modifyDate = function (id) {
        $location.path('/editRicontattoAppuntamento/'+id);
    };
    

}]);