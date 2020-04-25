app.controller('operatorRecessesCtrl', ['$scope', '$http', '$location', 'alertify', 'moment', function ($scope, $http, $location, alertify, moment) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.operatorRecesses = {};
    $scope.operatorRecesses.searchParam = {};

    $http.defaults.headers.common['Authorization'] = 'Bearer ' + $scope.user.TOKEN;

    $http.get('../../utility/province_comuni.json').then((result) => {
        // $scope.operatorRecesses.searchParam.provinciaSelected = "";
        $scope.operatorRecesses.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.operatorRecesses.province.splice(0, 0, ({ code: "", comuni: "", nome: "" }));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });

    $scope.operatorRecesses.comuniPerProvincia = "";

    $scope.operatorRecesses.disabledComuni = true;

    $scope.operatorRecesses.showComuni = function () {
        var newArray = $scope.operatorRecesses.province.filter(function (el) {
            return el.code === $scope.operatorRecesses.searchParam.provinciaSelected;
        });
        $scope.operatorRecesses.comuniPerProvincia = newArray[0].comuni;
        $scope.operatorRecesses.comuniPerProvincia.splice(0, 0, ({ code: "", comuni: "", nome: "" }));
        $scope.operatorRecesses.disabledComuni = false;
    }


    $scope.operatorRecesses.showRisultati = false;
    //PAGINATION START

    $scope.operatorRecesses.searchParam.currentPage = 1;
    $scope.operatorRecesses.searchParam.itemsPerPage = 10;

    $scope.pageChanged = function () {
        $scope.operatorRecesses.searchParam.startQuery = ($scope.operatorRecesses.searchParam.currentPage - 1) * $scope.operatorRecesses.searchParam.itemsPerPage;
        $scope.operatorRecesses.submitRecesses("pageChanged");
    };




    $scope.$on('$viewContentLoaded', function () {
        $scope.operatorRecesses.submitRecesses('submit');
    });

}]);