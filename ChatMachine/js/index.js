var myConnector = null;

function initilizeConnector(){
    myConnector = new webinosConnector("ChatMachine");
    myConnector.on('statusChange', function (state, old) {
        switch (state) {
            case myConnector.STATE.PZH_ONLINE:
                $("#connectionStatus").text("You are connected.");
                goOnline();
                break;
            case myConnector.STATE.PZH_OFFLINE:
                $("#connectionStatus").text("PZH is offline.");
                goOffline();
                break;
            case myConnector.STATE.VIRGIN:
                $("#connectionStatus").text("You must connect to a PZH.");
                goOffline();
                break;
        }
    });

    myConnector.listen("join", function(data){
        console.log("join");
        console.log(data);
        myConnector.broadcast("welcome",{nickname: localStorage.nickname, email: localStorage.email });
        if ($.inArray(data.data.nickname,knownnicknames)<0){
            knownnicknames.push(data.data.nickname);
            showjoiningmember(data.data.nickname, data.data.email);
        }
    });

    myConnector.listen("renamed", function(data){
        console.log("renamed");
        console.log(data);
        if ($.inArray(data.data.oldnickname,knownnicknames)){
            knownnicknames.splice($.inArray(data.data.oldnickname,knownnicknames),1);
        }
        knownnicknames.push(data.data.nickname);
        showrenamedmember(data.data.nickname, data.data.email, data.data.oldnickname);
    });



    myConnector.listen("welcome", function(data){
        console.log("welcome");
        console.log(data);
        if ($.inArray(data.data.nickname,knownnicknames)<0){
            showjoiningmember(data.data.nickname, data.data.email);
            knownnicknames.push(data.data.nickname);
        }
    });

    myConnector.listen("bye", function(data){
        console.log("bye");
        console.log(data);
        if ($.inArray(data.data.nickname,knownnicknames)>=0){
            showleavingmember(data.data.nickname, data.data.email);
            knownnicknames.splice($.inArray(data.data.nickname,knownnicknames),1);
        }
    });

    myConnector.listen("message", function(data){
        console.log("message");
        console.log(data);
        showMessage(data.data.nickname, data.data.email, "> " + data.data.msg);
    });
}

knownnicknames = [];

showrenamedmember = function(nickname,email, old){
    if (old!= nickname)
        $("#incomingMessages").append("<div class='message'><span class='username'><img src='"+ getGravatar(email) + "' width='16' height='16' style='float: left;margin-right: 5px;' alt='"+ nickname +"'/>" + old + " is now listed as "+ nickname + "</span></div>");
    else
        $("#incomingMessages").append("<div class='message'><span class='username'><img src='"+ getGravatar(email) + "' width='16' height='16' style='float: left;margin-right: 5px;' alt='"+ nickname +"'/>" + nickname + " changed his avatar.</span></div>");
    scrollDown();
};

showjoiningmember = function(nickname,email){
    showMessage(nickname,email,"joined.");
};

showleavingmember = function(nickname,email){
    showMessage(nickname,email,"left.");
};

showMessage = function(nickname, email, message){
    $("#incomingMessages").append("<div class='message'><span class='username'><img src='"+ getGravatar(email) + "' width='16' height='16' style='float: left;margin-right: 5px;' alt='"+ nickname +"'/>" + nickname + "</span> "+ message +"</div>");
    scrollDown();
}

showmymessage = function(message){
    $("#incomingMessages").append("<div class='mymessage'><img src='"+ getGravatar(localStorage.email) + "' width='16' height='16' style='float: left;margin-right: 5px;' alt='"+ localStorage.nickname +"'/>" + message +"</div>");
    scrollDown();
}

scrollDown = function(){
    var objDiv = document.getElementById("incomingMessages");
    objDiv.scrollTop = objDiv.scrollHeight;
};

goOnline = function(){
    $("#gravatarimage").attr("src",getGravatar(localStorage.email));
    $("#sendMessage").button('enable');
    myConnector.broadcast("join",{nickname: localStorage.nickname, email: localStorage.email });
};
goOffline = function(){
    $("#sendMessage").button('disable');
    if (myConnector)
        myConnector.broadcast("bye",{nickname: localStorage.nickname, email: localStorage.email });
};

getGravatar = function(email){
    return 'http://www.gravatar.com/avatar/' + $.md5(email) + '.png?s=64';
};

fixHeight = function(){
    $(".msgContainerDiv").height(
        $(window).height() - ( $('#mainheader').height() + $('#mainfooter').height() + 35 )
    )
};

$(document).ready(function() {
    goOffline();
    $(document).bind('pageshow', function (e) {
        if (e.target.id == "Options") {
            $("#email").val(localStorage.email);
            $("#nickname").val(localStorage.nickname);
        }
    });

    fixHeight();

    $(window).resize(fixHeight);

    $("#savesettings").click(function(){
        myConnector.broadcast("renamed",{oldnickname: localStorage.nickname, email: $("#email").val(), nickname: $("#nickname").val() });
       localStorage.email = $("#email").val();
       localStorage.nickname = $("#nickname").val();
       $.mobile.changePage("#Main");
       $("#gravatarimage").attr("src",getGravatar($("#email").val()));
        myConnector.broadcast("welcome",{nickname: localStorage.nickname, email: localStorage.email });
    });

    $("#sendMessage").click(function(){
        if ($("#textinput").val()!=""){
            showmymessage($("#textinput").val());
            myConnector.broadcast("message",{nickname: localStorage.nickname, email: localStorage.email, msg: $("#textinput").val() });
            $("#textinput").val("");
        }
    });

    $('#textinput').keypress(function (e) {
        if (e.which == 13) {
            $("#sendMessage").click();
        }
    });

});