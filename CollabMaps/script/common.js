$(document).ready(function() {
    $("#btn_addmarker").button({
        text: false
    }).click(function() {
        StreetViewer.addMarker();
    });

    webinosInjector.inject();

    $("#dlg_login").dialog({
        autoOpen: true,
        draggable: true,
        modal: true,
        title: "Login as...",
        buttons: {
            "Host": function() {
                StreetViewer.init('host', function(connected) {
                    if (connected) {
                        console.log("Connected");
                    }
                }, $("#txt_channelid").val());

                $("#btn_addmarker").css("display", "block");

                $(this).dialog("close");
            },
            "Guest": function() {
                StreetViewer.init('guest', function(connected) {
                    if (connected) {
                        console.log("Connected");
                    }
                }, $("#txt_channelid").val());

                $("#btn_addmarker").css("display", "block");

                $(this).dialog("close");
            }
        }
    });
});

$(window).unload(function() {
    console.log("unloading");
    StreetViewer.close();
});