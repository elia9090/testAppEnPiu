
app.controller('logoutCtrl', function ( $scope, $http, $location, $window) {
    document.getElementById("navbarToggleExternalContent").classList.remove("show");
    document.getElementById("btnMenuHome").setAttribute("aria-expanded", false);
    sessionStorage.clear();
    $location.path('/login');
});