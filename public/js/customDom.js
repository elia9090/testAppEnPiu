$(function(){

    $("#navbarToggleExternalContent .nav-link").on( "click", function() {
        document.getElementById("navbarToggleExternalContent").classList.remove("show");
        document.getElementById("btnMenuHome").setAttribute("aria-expanded", false);
    });
});