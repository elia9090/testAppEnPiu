app.controller('gasRecessesCtrl', ['$scope', '$http', '$location', 'alertify', 'moment', function ($scope, $http, $location, alertify, moment) {

    $scope.user = JSON.parse(sessionStorage.user);

    $scope.recessesGas = {};
    $scope.recessesGas.searchParam = {};
    $scope.recessesGas.venditoreSelected = [];
    $http.defaults.headers.common['Authorization'] = 'Bearer ' + $scope.user.TOKEN;

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
        // $scope.searchDate.searchParam.provinciaSelected = "";
        $scope.recessesGas.province = result.data.province;
        //INSERISCO UN DATO VUOTO PER PERMETTERE IL BLANK SULLE PROVINCIE
        $scope.recessesGas.province.splice(0, 0, ({ code: "", comuni: [], nome: "" }));
    }).catch((err) => {
        alertify.alert("Impossibile reperire la lista dei comuni");
    });
    $scope.recessesGas.comuniPerProvincia = "";

    $scope.recessesGas.disabledComuni = true;

    $scope.recessesGas.showComuni = function () {
        var newArray = $scope.recessesGas.province.filter(function (el) {
            return el.code === $scope.recessesGas.searchParam.provinciaSelected[0];
        });
        // se seleziono più di una provincia disabilito i comuni
        if($scope.recessesGas.searchParam.provinciaSelected.length > 1){
            $scope.recessesGas.searchParam.comuneSelected = "";
            $scope.recessesGas.disabledComuni = true;
            return
        }
        $scope.recessesGas.comuniPerProvincia = newArray[0].comuni;
        $scope.recessesGas.comuniPerProvincia.splice(0, 0, ({ code: "", comuni: [], nome: "" }));
        $scope.recessesGas.disabledComuni = false;
    }


    if ($scope.user.TYPE === 'ADMIN' || $scope.user.TYPE === 'BACK_OFFICE') {
        $scope.recessesGas.Stati = [
            {
                "Name": " ",
                "Value": ""
            },
            {
                "Name": "ASSEGNATO",
                "Value": "ASSEGNATO"
            },
            {
                "Name": "NON ASSOCIATO",
                "Value": "NON_ASSOCIATO"
            },
            {
                "Name": "NON GESTIRE",
                "Value": "NON_GESTIRE"
            },
            {
                "Name": "PRESO IN CARICO",
                "Value": "PRESO_IN_CARICO"
            },
            {
                "Name": "RESPINTO DA AGENTE",
                "Value": "RESPINTO"
            },
            {
                "Name": "APPUNTAMENTO",
                "Value": "APPUNTAMENTO"
            },
            {
                "Name": "RIENTRO",
                "Value": "RIENTRO"
            }

        ];
    } else if ($scope.user.TYPE === 'RESPONSABILE_AGENTI') {
        $scope.recessesGas.Stati = [
            {
                "Name": " ",
                "Value": ""
            },
            {
                "Name": "ASSEGNATO",
                "Value": "ASSEGNATO"
            },
            {
                "Name": "PRESO IN CARICO",
                "Value": "PRESO_IN_CARICO"
            },
            {
                "Name": "RESPINTO DA AGENTE",
                "Value": "RESPINTO"
            },
            {
                "Name": "RIENTRO",
                "Value": "RIENTRO"
            }
        ];
    } else if ($scope.user.TYPE === 'AGENTE' || $scope.user.TYPE === 'AGENTE_JUNIOR') {
        $scope.recessesGas.Stati = [
            {
                "Name": " ",
                "Value": ""
            },
            {
                "Name": "ASSEGNATO",
                "Value": "ASSEGNATO"
            },
            {
                "Name": "PRESO IN CARICO",
                "Value": "PRESO_IN_CARICO"
            }
        ];
    } else if ($scope.user.TYPE === 'OPERATORE') {
        $scope.recessesGas.Stati = [
            {
                "Name": " ",
                "Value": ""
            },
            {
                "Name": "RESPINTO DA AGENTE",
                "Value": "RESPINTO"
            },
            {
                "Name": "APPUNTAMENTO",
                "Value": "APPUNTAMENTO"
            }
        ];
    }



    $scope.recessesGas.searchParam.stato = {};



    $scope.recessesGas.URLgasRecessesList = "gasRecessesList";

    $scope.recessesGas.searchParam.venditoreSelected = "";

    if ($scope.user.TYPE == "ADMIN" || $scope.user.TYPE == "BACK_OFFICE") {




        //LISTA AGENTI SENZA RELAZIONI CON GLI OPERATORI E ELIMINATI LOGICAMENTE
        $http.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWSrecessi').then((result) => {
            $scope.recessesGas.agenti = result.data.agenti;


        }).catch((err) => {
            if (err.status === 403) {
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            alertify.alert("Impossibile reperire la lista degli agenti");
        });




    } else if ($scope.user.TYPE == "RESPONSABILE_AGENTI") {
        $scope.recessesGas.venditoreSelected = $scope.user.Id;

        $http.get('/listaAgentiForResponsabile/' + $scope.user.Id).then((result) => {
            $scope.recessesGas.venditoriForResponsabili = result.data.utenti;

        }).catch((err) => {
            if (err.status === 403) {
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }

            $scope.recessesGas.venditoriForResponsabili = [];
        });

    }
    else if ($scope.user.TYPE == "AGENTE" || $scope.user.TYPE === 'AGENTE_JUNIOR') {

        $scope.recessesGas.searchParam.venditoreSelected = $scope.user.Id;

    }

    $scope.recessesGas.showRisultati = false;
    //PAGINATION START

    $scope.recessesGas.searchParam.currentPage = 1;
    $scope.recessesGas.searchParam.itemsPerPage = 10;

    $scope.pageChanged = function () {
        $scope.recessesGas.searchParam.startQuery = ($scope.recessesGas.searchParam.currentPage - 1) * $scope.recessesGas.searchParam.itemsPerPage;
        $scope.recessesGas.submitRecessesGas("pageChanged");
    };

    /* $scope.recessesGas.previousSearch = {};

    //CONTROLLO SE CI SONO PARAMETRI DI RICERCA

    if(localStorage.getItem("searchParam")){
        $scope.recessesGas.searchParam = angular.fromJson(localStorage.getItem("searchParam"));
        if($scope.recessesGas.searchParam.venditoreSelected){
            $scope.recessesGas.searchParam.venditoreSelected = parseInt($scope.recessesGas.searchParam.venditoreSelected);
        }
        if($scope.recessesGas.searchParam.operatoriSelected){
            $scope.recessesGas.searchParam.operatoriSelected = parseInt($scope.recessesGas.searchParam.operatoriSelected);
        }
        if($scope.recessesGas.searchParam.dataAppuntamentoDAL){
            $scope.recessesGas.searchParam.dataAppuntamentoDAL = new Date($scope.recessesGas.searchParam.dataAppuntamentoDAL);
        }
        if($scope.recessesGas.searchParam.dataAppuntamentoAL){
            $scope.recessesGas.searchParam.dataAppuntamentoAL = new Date($scope.recessesGas.searchParam.dataAppuntamentoAL);
        }     
    }
 */


    //PAGINATION END

    // SEARCH AND ORDER BY Consumo contrattuale
    $scope.recessesGas.searchParam.order = ''

    $scope.recessesGas.searchParam.orderByConsumo = function () {

        if ($scope.recessesGas.searchParam.order == '') {
            $scope.recessesGas.searchParam.order = 'DESC';
        } else if ($scope.recessesGas.searchParam.order == 'DESC') {
            $scope.recessesGas.searchParam.order = 'ASC';
        } else if ($scope.recessesGas.searchParam.order == 'ASC') {
            $scope.recessesGas.searchParam.order = '';
        }
        // RESETTO L'OFFSET E LA PAGINAZIONE
        $scope.recessesGas.submitRecessesGas('submit');
    }



    // SE I RECESSI NON SONO 'ASSOCIATI' VADO A PRENDERE LE AGENZIE PER POTERCI FILTRARE I RECESSI IN RICERCA
    $scope.recessesGas.agenzieNonAssociati = [];
    $scope.recessesGas.agenzieNonAssociatiVALUE = '';
    $scope.recessesGas.checkIfStatusIsNonAssegnato = function (){
        if($scope.recessesGas.searchParam.stato.value === 'NON_ASSOCIATO' && ($scope.user.TYPE === 'ADMIN' || $scope.user.TYPE === 'BACK_OFFICE')){
            $http.get('/listaAgenzieNonAssociatiRecessiGas').then((result) => {
                $scope.recessesGas.agenzieNonAssociati = result.data.agenzieGas;
    
    
            }).catch((err) => {
                if (err.status === 403) {
                    alertify.alert("Utente non autorizzato");
                    $location.path('/logout');
                    return;
                }
                alertify.alert("Impossibile reperire la lista delle agenzie");
            });
        }
    }

    $scope.recessesGas.submitRecessesGas = function (pageChangedOrSubmit) {



        if (pageChangedOrSubmit === 'submit') {
            $scope.recessesGas.searchParam.currentPage = 1;
        }

        $scope.recessesGas.searchParam.startQuery = ($scope.recessesGas.searchParam.currentPage - 1) * $scope.recessesGas.searchParam.itemsPerPage;

        /*  //SALVO I PARAMETRI DI RICERCA START
         localStorage.removeItem("searchParam");
 
         localStorage.setItem("searchParam",angular.toJson($scope.recessesGas.searchParam) ); */

        //SALVO I PARAMETRI DI RICERCA END

        // UTILE PER FAR VISUALIZZARE SOLO I RECESSI DEL RESPONSABILE O DEI RELATIVI AGENTI SELEZIOANTI
        var agente = '';
        if (($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI" || $scope.user.TYPE === 'AGENTE_JUNIOR') && !$scope.recessesGas.searchParam.venditoreSelected) {
            agente = $scope.user.Id;
        } else {
            agente = $scope.recessesGas.searchParam.venditoreSelected;
        }
        // UTILE PER FAR VISUALIZZARE SOLO I RECESSI DEL RESPONSABILE O DEI RELATIVI AGENTI SELEZIOANTI
        $http.post($scope.recessesGas.URLgasRecessesList, {
            'limit': $scope.recessesGas.searchParam.itemsPerPage,
            'offset': $scope.recessesGas.searchParam.startQuery,
            'order': $scope.recessesGas.searchParam.order,
            'dataRecessoDAL': $scope.recessesGas.searchParam.dataRecessoDAL,
            'dataRecessoAL': $scope.recessesGas.searchParam.dataRecessoAL,
            'provincia': $scope.recessesGas.searchParam.provinciaSelected,
            'comune': $scope.recessesGas.searchParam.comuneSelected,
            'ragioneSociale': $scope.recessesGas.searchParam.ragioneSociale,
            'mcAnnui': $scope.recessesGas.searchParam.mcAnnui,
            'stato': $scope.recessesGas.searchParam.stato.value,
            'agenziaOriginaria' : $scope.recessesGas.searchParam.agenzieNonAssociatiVALUE,
            'agente': agente,
            'userType': $scope.user.TYPE


        }).then((result) => {

            if (result.data.recessiGas.length == 0) {

                $scope.recessesGas.showRisultati = false;
                alertify.alert("Nessun RecessiGas trovato per i parametri selezionati");
            } else {
                $scope.recessesGas.totalItems = parseInt(result.data.totaleRecessiGas);
                $scope.recessesGas.recessiGasResult = result.data.recessiGas;
                $scope.recessesGas.showRisultati = true;

            }

        }).catch((err) => {


            if (err.status === 403) {
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            if (err.status === 500) {
                alertify.alert("Errore nella ricerca RecessiGas");
            }


        });


    }

    /*   //se c'è l'oggetto searchParam in local storage rifaccio la query e mi metto nella paginazione corretta
      if(localStorage.getItem("searchParam")){
          $scope.recessesGas.submitRecessesGas("pageChanged");
      } */




    $scope.recessesGas.permanenza = function (dateOUT, dateIN) {
        var a = moment(dateIN);
        var b = moment(dateOUT);

        var years = a.diff(b, 'year');
        b.add(years, 'years');

        var months = a.diff(b, 'months');
        b.add(months, 'months');
        var permanenza = '';
        if (years > 0) {
            permanenza += years + (years > 1 ? ' anni ' : ' anno ');
        }
        if (months > 0) {
            permanenza += months + (months > 1 ? ' mesi ' : ' mese ');
        }
        if (permanenza == '') {
            permanenza = 'meno di un mese';
        }
        return permanenza;
    }


    $scope.$on('$viewContentLoaded', function () {
        $scope.recessesGas.submitRecessesGas('submit');
    });


    $scope.recessesGas.downloadRecessiGas = function () {

        if ($scope.recessesGas.totalItems && $scope.recessesGas.totalItems > 5000) {
            alertify.alert("Ci sono più di 5000 recessi Gas! Restingere la ricerca per l'export in Excel");
            return;
        }

        // UTILE PER FAR VISUALIZZARE SOLO I RECESSI DEL RESPONSABILE O DEI RELATIVI AGENTI SELEZIOANTI
        var agente = '';
        if (($scope.user.TYPE == "AGENTE" || $scope.user.TYPE == "RESPONSABILE_AGENTI" || $scope.user.TYPE === 'AGENTE_JUNIOR') && !$scope.recessesGas.searchParam.venditoreSelected) {
            agente = $scope.user.Id;
        } else {
            agente = $scope.recessesGas.searchParam.venditoreSelected;
        }

        $http.post('/downloadRecessiGas', {

            'order': $scope.recessesGas.searchParam.order,
            'dataRecessoDAL': $scope.recessesGas.searchParam.dataRecessoDAL,
            'dataRecessoAL': $scope.recessesGas.searchParam.dataRecessoAL,
            'provincia': $scope.recessesGas.searchParam.provinciaSelected,
            'comune': $scope.recessesGas.searchParam.comuneSelected,
            'ragioneSociale': $scope.recessesGas.searchParam.ragioneSociale,
            'mcAnnui': $scope.recessesGas.searchParam.mcAnnui,
            'stato': $scope.recessesGas.searchParam.stato.value,
            'agente': agente,
            'userType': $scope.user.TYPE

        }).then((result) => {

            if (result.data.recessiGas.length == 0) {
                alertify.alert("Nessun recesso trovato per i parametri selezionati");
            } else {
                var today = new Date().getDate() + "_" + (new Date().getMonth() + 1) + "_" + new Date().getFullYear();
                var fileName = 'EstrazioneRecessiGas_del_' + today + '.xlsx';

                var ws = XLSX.utils.json_to_sheet(result.data.recessiGas);
                var wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Recessi Gas');

                XLSX.writeFile(wb, fileName);

            }

        }).catch((err) => {

            if (err.status === 403) {
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
                return;
            }
            if (err.status === 500) {
                alertify.alert("Errore nel download dei recessi Gas");
            }


        });

    }

    

    // --------------------- MODALE RECESSO START ---------------------


    $scope.recessesGas.dettaglioRecesso = {};
    $scope.recessesGas.modifyRecess = function (recesso) {
        $scope.recessesGas.dettaglioRecesso = Object.assign({}, recesso);
        $scope.recessesGas.dettaglioRecesso.STATO_DA_INVIARE = $scope.recessesGas.dettaglioRecesso.STATO;
        $('#recessModal').modal('show');
    }

    $scope.recessesGas.cancel = function () {
        $('#recessModal').modal('hide');
    };

    $scope.recessesGas.updateRecesso = function () {
        $http.patch('/gasRecess/' + $scope.recessesGas.dettaglioRecesso.ID_DETTAGLIO_GAS, {
            'agente': $scope.recessesGas.dettaglioRecesso.ID_VENDITORE,
            'refRecesso': $scope.recessesGas.dettaglioRecesso.REFERENTE_RECESSO,
            'refRecapito': $scope.recessesGas.dettaglioRecesso.REFERENTE_RECESSO_RECAPITO,
            'codContratto': $scope.recessesGas.dettaglioRecesso.COD_CONTRATTO,
            'stato': $scope.recessesGas.dettaglioRecesso.STATO_DA_INVIARE,
            'note': $scope.recessesGas.dettaglioRecesso.NOTE,

        }).then((result) => {
            alertify.alert('Recesso modificato correttamente');
            $scope.recessesGas.submitRecessesGas();
            $('#recessModal').modal('hide');

        }).catch((err) => {
            if (err.status === 500) {
                alertify.alert("Errore nella modifica del Recesso");
            }
            if (err.status === 403) {
                alertify.alert("Utente non autorizzato");
                $location.path('/logout');
            }
        });
    };
}]);