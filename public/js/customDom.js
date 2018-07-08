
$(function(){

    $("#navbarToggleExternalContent .nav-link").on( "click", function() {
        document.getElementById("navbarToggleExternalContent").classList.remove("show");
        document.getElementById("btnMenuHome").setAttribute("aria-expanded", false);
    });

  
});
$.blockUI.defaults.message = '<img class="loaderGIF" src="..//img/loader.gif" />'; 
$.blockUI.defaults.css = { 
    padding: 0,
    margin: 0,
    width: '30%',
    top: '40%',
    left: '35%',
    textAlign: 'center',
    cursor: 'wait'
};
