
app.controller('dashboardCtrl',['$scope', '$http','$location','alertify', function ( $scope, $http,$location,alertify) {

    
    $scope.dashBoard = {};

    $scope.dashBoard.height_chart = "";
    if(innerWidth<1000){
        $scope.dashBoard.height_chart = 500;
    }
   
    
    $scope.user = JSON.parse(sessionStorage.user);

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;

   

    if($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE"){
        
        $http.get('/dateStatsAdminDashboard').then((result) => {
        
        $scope.dashBoard.stats = result.data.stats;



        $scope.labels = ["% Contratti su appuntamenti",""];
        $scope.data = [parseInt($scope.dashBoard.stats.PERC_CONTRATTI_O_APPUNTAMENTI),100 - parseInt($scope.dashBoard.stats.PERC_CONTRATTI_O_APPUNTAMENTI)];
        $scope.colors = ["rgb(45,204,112)","rgb(232,76,61)"];
        $scope.options = {
            segmentShowStroke : true,
            animationSteps : 1,
            animationEasing : "linear"
            
        };  

        $scope.labels1 = ["OK", "KO", "VALUTA","ASSENTE","NON VISITATO", "DA ESITARE"];
        $scope.data1 = [$scope.dashBoard.stats.OK_PERC, $scope.dashBoard.stats.KO_PERC, $scope.dashBoard.stats.VALUTA_PERC, $scope.dashBoard.stats.ASSENTE_PERC, $scope.dashBoard.stats.NON_VISITATO_PERC, $scope.dashBoard.stats.DA_ESITARE_PERC];
        $scope.colors1 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(149,165,166)","rgb(189,195,199)","rgb(142,68,173)"];
        $scope.options1 = {
            segmentShowStroke : true,
            animationSteps : 1,
            animationEasing : "linear",
            legend: {display: true},
          
        };
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire le statistiche appuntamenti");
        });

    

        $http.get('/recessesStatsAdminDashboard').then((result) => {
        
            $scope.dashBoard.statsLuce = result.data.statsLuce;
            $scope.dashBoard.statsGas = result.data.statsGas;
    
    
            $scope.labels2 = ["RIENTRO", "RESPINTO","PRESO IN CARICO", "ASSEGNATO","NON ASSOCIATO"];
            $scope.data2 = [$scope.dashBoard.statsLuce.RIENTRO_PERC, $scope.dashBoard.statsLuce.RESPINTO_PERC, $scope.dashBoard.statsLuce.PRESO_IN_CARICO_PERC, $scope.dashBoard.statsLuce.ASSEGNATO_PERC,$scope.dashBoard.statsLuce.NON_ASSOCIATO_PERC];
            $scope.colors2 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(189,195,199)","rgb(142,68,173)"];
            $scope.options2 = {
                segmentShowStroke : true,
                animationSteps : 1,
                animationEasing : "linear",
                legend: {display: true},
              
            };
    
            $scope.labels3 = ["RIENTRO", "RESPINTO","PRESO IN CARICO", "ASSEGNATO","NON ASSOCIATO"];
            $scope.data3 = [$scope.dashBoard.statsGas.RIENTRO_PERC, $scope.dashBoard.statsGas.RESPINTO_PERC, $scope.dashBoard.statsGas.PRESO_IN_CARICO_PERC, $scope.dashBoard.statsGas.ASSEGNATO_PERC,$scope.dashBoard.statsGas.NON_ASSOCIATO_PERC];
            $scope.colors3 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(189,195,199)","rgb(142,68,173)"];
            $scope.options3 = {
                segmentShowStroke : true,
                animationSteps : 1,
                animationEasing : "linear",
                legend: {display: true},
              
            };
               
                
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alertify.alert("Impossibile reperire le statistiche recessi");
            });
    


    }
    if($scope.user.TYPE == "OPERATORE"){
        
        $http.get('/dateStatsOperatoreDashboard/'+$scope.user.Id).then((result) => {
        
        $scope.dashBoard.stats = result.data.stats;



        $scope.labels1 = ["OK", "KO", "VALUTA","ASSENTE","NON VISITATO", "DA ESITARE"];
        $scope.data1 = [$scope.dashBoard.stats.OK_PERC, $scope.dashBoard.stats.KO_PERC, $scope.dashBoard.stats.VALUTA_PERC, $scope.dashBoard.stats.ASSENTE_PERC, $scope.dashBoard.stats.NON_VISITATO_PERC, $scope.dashBoard.stats.DA_ESITARE_PERC];
        $scope.colors1 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(149,165,166)","rgb(189,195,199)","rgb(142,68,173)"];
        $scope.options1 = {
            segmentShowStroke : true,
            animationSteps : 1,
            animationEasing : "linear",
            legend: {display: true},
          
        };
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire le statistiche appuntamenti");
        });

    }
    
    if($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI" || $scope.user.TYPE == "AGENTE_JUNIOR"){

        if(!sessionStorage.getItem('checkRecessi')){
            $http.get('/checkRecessiAgente/'+$scope.user.Id).then((result) => {
                var check = result.data;
                if(check.countRecessiLuce > 0 && check.countRecessiGas > 0){
                    alertify.alert("Ci sono recessi Gas e Luce da gestire");
                }else if(check.countRecessiLuce > 0 && check.countRecessiGas == 0){
                    alertify.alert("Ci sono recessi Luce da gestire");
                }else if(check.countRecessiLuce == 0 && check.countRecessiGas > 0){
                    alertify.alert("Ci sono recessi Gas gestire");
                }
                sessionStorage.setItem('checkRecessi', 'ok');
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
            });
        }
       
;
        
        $http.get('/dateStatsVenditoreDashboard/'+$scope.user.Id).then((result) => {
        
        $scope.dashBoard.stats = result.data.stats;



        $scope.labels = ["% Contratti su appuntamenti",""];
        $scope.data = [parseInt($scope.dashBoard.stats.PERC_CONTRATTI_O_APPUNTAMENTI),100 - parseInt($scope.dashBoard.stats.PERC_CONTRATTI_O_APPUNTAMENTI)];
        $scope.colors = ["rgb(45,204,112)","rgb(232,76,61)"];
        $scope.options = {
            segmentShowStroke : true,
            animationSteps : 1,
            animationEasing : "linear"
            
        };  

        $scope.labels1 = ["OK", "KO", "VALUTA","ASSENTE","NON VISITATO", "DA ESITARE"];
        $scope.data1 = [$scope.dashBoard.stats.OK_PERC, $scope.dashBoard.stats.KO_PERC, $scope.dashBoard.stats.VALUTA_PERC, $scope.dashBoard.stats.ASSENTE_PERC, $scope.dashBoard.stats.NON_VISITATO_PERC, $scope.dashBoard.stats.DA_ESITARE_PERC];
        $scope.colors1 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(149,165,166)","rgb(189,195,199)","rgb(142,68,173)"];
        $scope.options1 = {
            segmentShowStroke : true,
            animationSteps : 1,
            animationEasing : "linear",
            legend: {display: true},
          
        };
           
            
        }).catch((err) => {
            if(err.status === 403){
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire le statistiche appuntamenti");
        });



        $http.get('/recessesStatsVenditoreDashboard/'+$scope.user.Id).then((result) => {
        
            $scope.dashBoard.statsLuce = result.data.statsLuce;
            $scope.dashBoard.statsGas = result.data.statsGas;
    
    
            $scope.labels2 = ["RIENTRO", "RESPINTO","PRESO IN CARICO", "ASSEGNATO"];
            $scope.data2 = [$scope.dashBoard.statsLuce.RIENTRO_PERC, $scope.dashBoard.statsLuce.RESPINTO_PERC, $scope.dashBoard.statsLuce.PRESO_IN_CARICO_PERC, $scope.dashBoard.statsLuce.ASSEGNATO_PERC];
            $scope.colors2 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(189,195,199)"];
            $scope.options2 = {
                segmentShowStroke : true,
                animationSteps : 1,
                animationEasing : "linear",
                legend: {display: true},
              
            };
    
            $scope.labels3 = ["RIENTRO", "RESPINTO","PRESO IN CARICO", "ASSEGNATO"];
            $scope.data3 = [$scope.dashBoard.statsGas.RIENTRO_PERC, $scope.dashBoard.statsGas.RESPINTO_PERC, $scope.dashBoard.statsGas.PRESO_IN_CARICO_PERC, $scope.dashBoard.statsGas.ASSEGNATO_PERC];
            $scope.colors3 = ["rgb(45,204,112)","rgb(232,76,61)","rgb(255,207,21)","rgb(189,195,199)"];
            $scope.options3 = {
                segmentShowStroke : true,
                animationSteps : 1,
                animationEasing : "linear",
                legend: {display: true},
              
            };
               
                
            }).catch((err) => {
                if(err.status === 403){
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alertify.alert("Impossibile reperire le statistiche recessi");
            });

    }

 

}]);