
app.controller('dashboardCtrl', function ( $scope, $http, $location, $window) {
    $scope.height_chart = "";
    if(innerWidth<1000){
        $scope.height_chart = 500;
    }
   
    
    $scope.user = JSON.parse(sessionStorage.user);
    $scope.labels = ["OK", "KO", "In attesa"];
    $scope.data = [70, 20, 10];
    $scope.colors = ["rgb(45,204,112)","rgb(232,76,61)","rgb(154,154,154)"];
    $scope.options = {
        segmentShowStroke : true,
        animationSteps : 1,
        animationEasing : "linear",
        legend: {display: true}
    };  
    $scope.labels1 = ["Emanuele", "Nicola", "Umberto"];
    $scope.data1 = [50, 40, 10];
    $scope.colors1 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(154,154,154)"];
    $scope.options1 = {
        segmentShowStroke : true,
        animationSteps : 1,
        animationEasing : "linear",
        legend: {display: true},
      
    };  

});