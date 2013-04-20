$(document).bind("mobileinit", function() {
    $.mobile.autoInitializePage = false;
    $.mobile.defaultPageTransition = 'none';
    $.mobile.touchOverflowEnabled = false;
    $.mobile.defaultDialogTransition = 'none';
    $.mobile.zoom.enabled = false;
    $.mobile.buttonMarkup.hoverDelay = 0; //defaults 200
});