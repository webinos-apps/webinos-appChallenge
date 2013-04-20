whiteboard = function () {
    var version = "0.7-alpha";
    var _initialized = false;

    var isSinglePlayer = true;
    var roomName = false;
    var myConnector = null;
    var myCanvas = null;
    var that = this;

    var connectedToRoom = false;
    var myRoomName = "";
    var searchingRooms = false;
    var roomsFound = [];

    this.init = function () {
        if (_initialized == true) return;
        console.log("Whiteboard INIT");
        $("#pgHome #version").text(version);

        $(document).bind('pageshow', function (e) {
            console.log("pageshow");
            if (e.target.id == "pgJoin") {
                that.searchRooms();
            }else if (e.target.id == "pgHome") {
                that.leaveRoom();
            }else if (e.target.id == "pgPen") {
//                $('#picker').farbtastic('#color');
            }

        });
        $(document).bind('pageinit', function (e) {
            console.log("pageinit " + e.target.id);
            if (e.target.id == "pgPen") {
                $('#color').val(myCanvas.getColor());
                $('#picker').farbtastic(function(e){
                    $('#color').css({backgroundColor:e}).val(e);
                    myCanvas.setColor(e);
                });

                $("#thickness").val(myCanvas.getThickness());
                $("#thickness").bind("change", function(e, ui){
                    myCanvas.setThickness(this.value);
                });
            }

        });

        myConnector = new webinosConnector("whiteboard");


        myCanvas = new whiteboardCanvas(that);
        myCanvas.init();

        myConnector.on('statusChange', function (state, old) {
            switch (state) {
                case myConnector.STATE.PZH_ONLINE:
                    $("#connectionStatus").text("You are connected.");
                    that.goOnline();
                    break;
                case myConnector.STATE.PZH_OFFLINE:
                    $("#connectionStatus").text("PZH is offline.");
                    that.goOffline();
                    break;
                case myConnector.STATE.VIRGIN:
                    $("#connectionStatus").text("You must connect to a PZH.");
                    that.goOffline();
                    break;
            }
        });

        myConnector.listen("anyRooms", function(data){
            console.log("anyRooms");
            console.log(data);
            if (connectedToRoom){
                myConnector.broadcast("takeARoom",{roomName:myRoomName});
            }
        });
        myConnector.listen("takeARoom", function(data){
            console.log("takeARoom");
            console.log(data);
            that.addRoom(data.data.roomName);
        });
        myConnector.listen("command", function(data){
            console.log("command");
            console.log(data);
            if (myRoomName == data.data.roomName){
                myCanvas.processReceivedCommand({
                    roomName:data.data.roomName,
                    from:data.from,
                    cmd:data.data.cmd,
                    args:data.data.args
                });
            }
        });
        _initialized = true;
    };

    this.broadcast = function(commandName, data){
        myConnector.broadcast("command",{
            roomName:myRoomName,
            cmd:commandName,
            args:data
        });
    };

    this.addRoom = function(name){
        if (!that.roomExists(name)){
            roomsFound.push(name);
            var $targetUl = $("#pgJoin #roomList");
            $targetUl.html('');
            for (i in roomsFound){
                var li = '<li>' +
                    '<a href="#" onclick="app.joinRoom(\''+roomsFound[i]+'\');">' +
                    roomsFound[i]+
                    '</a>' +
                    '</li>';
                $targetUl.append(li);
            }
            $targetUl.trigger('create').listview('refresh');
        }
    };

    this.goOnline = function(){
        $("#pgHome .showIfOnline").toggle(true);
        $("#pgHome .showIfOffline").toggle(false);
    };
    this.goOffline = function(){
        $("#pgHome .showIfOffline").toggle(true);
        $("#pgHome .showIfOnline").toggle(false);
    };

    this.searchRooms = function(){
        myConnector.broadcast("anyRooms");
    };

    this.createRoom = function(){
        var $name = $("#pgHost #whiteboardName");
        var name = $name.val();
        var valid = true;
        var err = "";
        if (name==""){
            valid = false;
            err = "You must enter a name";
        }
        name = name.replace("'","&rsquo;");
        name = name.replace("<","&lt;");
        name = name.replace(">","&gt;");
        if (valid){
            myConnector.broadcast("takeARoom",{roomName:name});
            that.joinRoom(name);
        }else{
            alert(err);
        }
    };

    this.roomExists = function(name){
        for (i in roomsFound){
            if (roomsFound[i]==name){
                return true;
            }
        }
        return false;
    };

    this.joinRoom = function(name){
        myRoomName = name;
        connectedToRoom = true;
        $("#pgCanvas #canvasTitle").html(name);
        document.location.hash = "#pgCanvas";

    };

    this.leaveRoom = function(){
        myRoomName = "";
        connectedToRoom = false;
        myCanvas.exit();
        $("#pgCanvas #canvasTitle").text("Drawing Alone");
    };
    this.isConnected = function(){
        return connectedToRoom;
    }
};