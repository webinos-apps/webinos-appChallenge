myWebinos = {
    isConnected:false, //State variable to keep track of connected
    Events:{
        Ready:'webinosReady',
        PZHDisconnected:'pzhDisconnected',
        NoPZH:'youArNotconnectedToPzh',
        EventsReady:'webinosEventsReady'
    },
    init:function () {
        //Wait webinos to connect. This doesn't work all the times :(
        webinos.session.addListener('registeredBrowser', function (data) {
            //If this is the first time
            if (!myWebinos.isConnected) {
                myWebinos.isConnected = true;
                //we notify the game that we have connected to the pzp
                Crafty.trigger(myWebinos.Events.Ready, null);
            }
            if (!data.payload.message.enrolled || data.payload.message.state.Pzh !== "connected") {
                //There is no PZH
                myWebinos.handleNoPZH(data.from);
            } else {
                //Initialize apis
                myWebinos.EventAPI.init();
            }
        });
        //This is why we will try to connect manually after 2 secs
        setTimeout(function () {
            if (!myWebinos.isConnected)// If we haven't received the registerBrowserEvent yet
                myWebinos.EventAPI.init(); //Try to initialize EventAPI
        }, 2000);
    },
    handleNoPZH:function (from) {
        // Clear event API
        myWebinos.EventAPI.clear();
        if (from.split('/').length > 1) {
            //There is a PZH but not connected to it
            Crafty.trigger(myWebinos.Events.PZHDisconnected, null);
        } else {
            Crafty.trigger(myWebinos.Events.NoPZH, null);
        }
    },
    EventAPI:{
        myHost:{},
        messagePrefix:"WordBattle_", //A prefix on all event types to avoid receiving events from other apps
        service:null,
        eventListenerId:null,
        init:function () { // Binds the event API
            // Find service
            webinos.ServiceDiscovery.findServices(
                new ServiceType('http://webinos.org/api/events'),
                {
                    onFound:function (service) {
                        //Perhaps we should filter potential other connected PZHs but
                        //there is no documentation on this
                        service.bind({// Bind the service
                            onBind:function (service) {
                                //Clear the previous one
                                myWebinos.EventAPI.clear();
                                //And assign the new
                                myWebinos.EventAPI.service = service;
                                myWebinos.EventAPI.eventListenerId = service.addWebinosEventListener(myWebinos.EventAPI.eventReceived);
                                Crafty.trigger(myWebinos.Events.EventsReady, null);
                                //And set the host for this instance
                                myWebinos.EventAPI.myHost = myWebinos.EventAPI.parseFromPeer(myWebinos.EventAPI.service.myAppID);
                            }
                        });
                    },
                    onError:function () {
                        myWebinos.EventAPI.clear();
                        //Since we failed to connect
                        // we will raise a pzh issue
                        myWebinos.handleNoPZH('');
                    }
                }
            );
        },
        clear:function () {//Clear the api
            //Try to remove the Event Listener
            if (myWebinos.EventAPI.service != null && myWebinos.EventAPI.eventListenerId != null) {
                try {
                    myWebinos.EventAPI.service.removeWebinosEventListener(myWebinos.EventAPI.eventListenerId);
                } catch (error) {
                    //This is normal if we have disconnected the pzh
                }
            }
            myWebinos.EventAPI.service = null;
            myWebinos.EventAPI.eventListenerId = null;
        },
        eventReceived:function (event) {
            // If it's the event I send, ignore it
            if (event.addressing.source.id === myWebinos.EventAPI.service.myAppID) return;
            //Ignore events from other applications
            if (event.type.substring(0, myWebinos.EventAPI.messagePrefix.length) != myWebinos.EventAPI.messagePrefix) return;
            //Get the pure event type
            var type = event.type.substring(myWebinos.EventAPI.messagePrefix.length);
            Game.webinos.parseMessage(myWebinos.EventAPI.parseFromPeer(event.addressing.source.id), type, event.payload);
        },
        parseFromPeer:function (id) {
            var connectedRegex = /([A-Za-z0-9\-_\.]+)\/([A-Za-z0-9\-_\.]+)(?:\/)?(.+)?/;
            var nameParts;
            //If it's connected
            if (nameParts = id.match(connectedRegex)) {
                return {pzh:nameParts[1], pzp:nameParts[2]};
            } else {
                //We can't receive message from disconnected device
                return {pzh:null, pzp:null};
            }
        },
        send:function (type, msg) {
            if (myWebinos.EventAPI.service != null) {
                var event = myWebinos.EventAPI.service.createWebinosEvent();
                event.type = myWebinos.EventAPI.messagePrefix + type;
                event.payload = msg;
                event.dispatchWebinosEvent();
            }
        }
    }

};