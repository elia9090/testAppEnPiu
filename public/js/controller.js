
app.controller('loginAppCtrl', function ($scope, $http, $location, $window) {
    

    $scope.submitLogin = function () {
        $http.post('/login', {
            'username' : $scope.username,
            'password' : $scope.password
        }).then((result) => {
            $scope.user = {};
            $scope.user.Id = result.data.utente.ID_UTENTE;
            $scope.user.NAME = result.data.utente.NOME;
            $scope.user.SURNAME = result.data.utente.COGNOME;
            $scope.user.TYPE = result.data.utente.TIPO;
            $scope.user.USERNAME = result.data.utente.USERNAME;
            $scope.user.TOKEN = result.data.token;
            sessionStorage.user = JSON.stringify($scope.user);
            $location.path('/dashboard');
        }).catch((err) => {
            if(err.status === 404){
                alert("Nome utente o password errati!");
            }
            if(err.status === 500){
                alert("Servizio di login non è disponibile");
            }
        });
    };
});
app.controller('dashboardAppCtrl', function ( $scope, $http, $location, $window) {

    $scope.user = JSON.parse(sessionStorage.user);
    // $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    
    

});

app.controller('nuovoAppuntamentoAppCtrl', function ( $scope, $http, $location, $window) {
    
    /*if(true){

        $location.path('/dashboard');
    }*/

    $scope.user = JSON.parse(sessionStorage.user);
    // $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
    $http.get('../utility/province_comuni.json').then((result) => {
        $scope.provinciaSelected = "";
        $scope.province = result.data.province;
    }).catch((err) => {
        alert("Impossibile reperire la lista dei comuni");
    });
    $scope.comuniPerProvincia = "";
    $scope.disabledComuni = true;
    $scope.showComuni = function(){
        var newArray = $scope.province.filter(function (el) {
            return el.nome ===  $scope.provinciaSelected;
          });
        $scope.comuniPerProvincia = newArray[0].comuni;
        $scope.disabledComuni = false;
    }
    

});

app.controller('addUser', function ( $scope, $http, $location,$rootScope) {
   
    $scope.user = JSON.parse(sessionStorage.user);
   
    if(!$scope.user.TYPE == "ADMIN"){
        $location.path('/dashboard');
    }

    $http.defaults.headers.common['Authorization'] = 'Bearer ' +  $scope.user.TOKEN;
   
    $scope.nome = "";
    $scope.cognome = "";
    $scope.username = "";
    $scope.password = "";
    $scope.userType = "";
    $scope.operatoreAssociato = "";
    $scope.responsabileAssociato = "";
    $scope.operatori = "";
    $scope.responsabili = "";



    $http.get('/listaResponsabiliAgentiWS').then((result) => {
        
    $scope.responsabili = result.data.responsabili;
    }).catch((err) => {
        alert("Impossibile reperire la lista dei responsabili");
    });
    $http.get('/listaOperatoriWS').then((result) => {
        $scope.operatori =  result.data.operatori;
    }).catch((err) => {
        alert("Impossibile reperire la lista degli operatori");
    });


 
});

app.controller('logoutCtrl', function ( $scope, $http, $location, $window) {
    document.getElementById("navbarToggleExternalContent").classList.remove("show");
    document.getElementById("btnMenuHome").setAttribute("aria-expanded", false);
    sessionStorage.clear();
    $location.path('/login');
});