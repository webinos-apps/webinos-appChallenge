function loadWebinosScript(){
    if(window.WebSocket || window.MozWebSocket)
    {
        $.getScript("/webinos.js", initializeWebinos);
    }
    else
    {
        if(typeof WebinosSocket == 'undefined')
        {
            setTimeout(loadWebinosScript, 500);
        }
        else
        {
            $.getScript("/webinos.js", initializeWebinos);
        }
    }
};
var webinosLoaded = false;

function initializeWebinos(){
    webinos.session.addListener('registeredBrowser', function (data) {
        if (!webinosLoaded){
            webinosLoaded = true;
            initilizeConnector();
        }
    });
    if(webinos.session.getSessionId()!=null){
        webinos.session.message_send({type: 'prop', payload: {status:'registerBrowser'}});
    }
};

$(document).ready(function() {
    loadWebinosScript();
});
