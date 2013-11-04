/**
 * The main StreetViewer app class.
 * @type Object
 */
var StreetViewer = StreetViewer || {};

/**
 * Constructor for Message
 * @constructor
 * @param ns - the message namespace
 * @param cmd - the function call
 * @param ref - identifier for the call 
 * @param params - the parameters of the function, as as struct
 */
StreetViewer.Message = function(namespace, cmd, ref, params) {
    this.ns = namespace;
    this.ref = ref || undefined;
    this.cmd = cmd;
    this.params = params;
};

/**
 * Initialises the webinos app2app channel and set up the communication protocol
 * @param hostorguest either 'host' or 'guest', relevant for a2a-stub behaveour
 * @param callback gets called when the player is initialized.
 */
StreetViewer.init = function(hostorguest, callback, channelid) {
    var self = this;
    this.isHost = false;
    this.channel = undefined;
    var CHANNEL_NAMESPACE = "urn:eu:istvank:streetviewer:channel" + channelid;

    // init maps
    this.dragEndFlag = false;
    this.markers = {};
    if (this.map == null) {
        // query webinos for location
        webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
            onFound: this.onWebinosServiceFound
        });

        var mapOptions = {
            zoom: 5,
            center: new google.maps.LatLng(51.76433407736961, 4.958202838897705),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.map = new google.maps.Map($("#map_canvas")[0], mapOptions);

        // an overlay to easen lat/lon to Pixel calculations
        function ProjectionOverlay() {
        }

        ProjectionOverlay.prototype = new google.maps.OverlayView();
        ProjectionOverlay.prototype.constructor = ProjectionOverlay;
        ProjectionOverlay.prototype.onAdd = function() {
        };
        ProjectionOverlay.prototype.draw = function() {
        };
        ProjectionOverlay.prototype.onRemove = function() {
        }
        this.overlay = new ProjectionOverlay();
        this.overlay.setMap(this.map);

        google.maps.event.addListener(this.map, "idle", this.onMapIdle);
        google.maps.event.addListener(this.map, "dragend", this.onMapDragEnd);
        // hotfix for supporting zoom
        google.maps.event.addListener(this.map, "zoom_changed", this.onMapDragEnd);
    }


    // when the streetviewer is initialized by the host
    if (hostorguest === 'host') {
        this.isHost = true;
    }

    //TODO: check these...
    var zoneId;
    var partyAddress = null;

    webinos.discovery.findServices(new ServiceType("http://webinos.org/api/app2app"), {
        /**
         * When the service is found
         * @param service The service that is found.
         * @private
         */
        onFound: function(service) {
            webinosInjector.onServiceHasLoaded(service, function() {
                // if the found service is not the service we are looking for...
                if (self.channel) {
                    return; // already connected to a service
                } else if (!partyAddress && service.serviceAddress != webinos.session.getPZHId()) {
                    return; // we are looking for a service within our own personal zone
                } else if (partyAddress && service.serviceAddress.indexOf(partyAddress) === -1) {
                    return; // we are looking for a specific service and this is not it
                } else {
                    service.bindService({
                        onBind: function() {
                            connect(service);
                        }
                    });
                }
            });
        },
        /**
         * When an error occurs.
         * @param error The object describing the error event.
         * @private
         */
        onError: function(error) {
            alert("Error finding service: " + error.message + " (#" + error.code + ")");
        }
    }, null, zoneId);

    /**
     * Connect to app2app channel. When in host mode this function will create a channel and connect to it. When in
     * guest mode the function connects to the host channel.
     * @param app2app The app2app service used for channel interaction.
     * @private
     */
    var connect = function(app2app) {
        if (self.isHost) {
            var properties = {};

            // we allow all channel clients to send and receive
            properties.mode = "send-receive";

            var config = {};
            // the namespace is an URN which uniquely defines the channel in the personal zone
            config.namespace = CHANNEL_NAMESPACE;
            config.properties = properties;
            // we can attach application-specific information to the channel
            config.appInfo = {};

            app2app.createChannel(
                config,
                // callback invoked when a client want to connect to the channel
                function(request) {
                    // we allow all clients to connect
                    return true;
                    //return confirm("Do you allow the party guest to connect?");
                },
                // callback invoked to receive messages
                function(message) {
                    console.log("The party host received a message: " + message.contents);
                    handleMessage(message);
                },
                // callback invoked on success, with the client's channel proxy as parameter
                function(channel) {
                    self.channel = channel;
                    callback(true);
                },
                function(error) {
                    if (!self.channel) {
                        alert("Could not create channel: " + error.message);
                        callback(false);
                    }
                }
            );
        } else {
            app2app.searchForChannels(
                CHANNEL_NAMESPACE,
                // for now no other zones need to be searched, only its own personal zone
                [],
                // callback invoked on each channel found, we expect it to be called at most once
                // because we did not use a wildcard
                function(channel) {
                    // we can include application-specific information to the connect request
                    var requestInfo = {};
                    channel.connect(
                        requestInfo,
                        // callback invoked to receive messages, only after successful connect
                        function(message) {
                            console.log("Party guest received message from party host: " + message.contents);
                            handleMessage(message);
                        },
                        // callback invoked when the client is successfully connected (i.e. authorized by the creator)
                        function(success) {
                            // make the proxy available now that we are successfully connected
                            self.channel = channel;
                            callback(true);
                        },
                        function(error) {
                            if (!self.channel) {
                                alert("Could not connect to channel: " + error.message);
                                callback(false);
                           }
                        }
                    );
                },
                // callback invoked when the search query is accepted for processing
                function(success) {
                    // ok, but no action needed for now
                },
                function(error) {
                    //alert("Could not search for channel: " + error.message);
                }
            );
        }
    };

    /**
    * Handles a message that is received on the party channel.
    * @private
    * @param message The payload of the received message
    */
    var handleMessage = function(message) {
        var msg = message.contents;
        var from = message.from;

        var func, handler;

        // when the message is a party player message
        if (msg.ns == "maps_update") {
            StreetViewer.map.setZoom(msg.params.zoom);
            var center = new google.maps.LatLng(msg.params.lat, msg.params.lng);
            StreetViewer.map.setCenter(center);
        } else if (msg.ns == "maps_movemarker") {
            var position = new google.maps.LatLng(msg.params.lat, msg.params.lng);
            StreetViewer.moveMarker(msg.params.id, position);
        } else if (msg.ns == "maps_addmarker") {
            var position = new google.maps.LatLng(msg.params.lat, msg.params.lng);
            StreetViewer.addMarker(msg.params.id, position);
        }
     };
};

StreetViewer.sendMessage = function(msg) {
    if (this.channel && this.channel.send) {
        this.channel.send(msg);
    } else {
        console.log('No channel present. Not sending messsage <' + msg + '>');
    }
};


/**
* Closes the current connected channel
*/
StreetViewer.close = function() {
    if (this.channel) {
        this.channel.disconnect();
        this.channel = undefined;
    }
};



StreetViewer.onWebinosServiceFound = function(service) {
    service.bindService({
        onBind: function(boundService) {
            console.log("Bound service: " + boundService.serviceAddress);
            boundService.getCurrentPosition(StreetViewer.onWebinosGeoSuccess, StreetViewer.onWebinosGeoError, {});
        }
    });
};

StreetViewer.onWebinosGeoSuccess = function(position) {
    //var center = StreetViewer.getLocalLatLng(position.coords.latitude, position.coords.longitude);
    var center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    StreetViewer.map.setCenter(center);
};

StreetViewer.onWebinosGeoError = function() {
    console.log("ERROR finding location, giving up")
};




/**
* Called on map.idle events.
*/
StreetViewer.onMapIdle = function(evt) {
   if (StreetViewer.dragEndFlag == true) {
       console.log("onMapIdle after dragging");

       // publish new location
       var params = {};
       params.zoom = StreetViewer.map.getZoom();
       params.lat = StreetViewer.map.getCenter().lat();
       params.lng = StreetViewer.map.getCenter().lng();
       
       var msg = new StreetViewer.Message("maps_update", null, null, params);
       StreetViewer.sendMessage(msg);

//       StreetViewer.publishMaps(StreetViewer.getGlobalLatLng(center.lat(), center.lng()), zoom);
//
       this.dragEndFlag = false;
   }
};

/**
* Called on map.dragend events.
*/
StreetViewer.onMapDragEnd = function(evt) {
   console.log("onDragEnd");
   StreetViewer.dragEndFlag = true;
};

/**
* Called when an element gets dragged. Publishes its new coordinates to the server.
*/
StreetViewer.onDrag = function(evt) {
   if (StreetViewer.isPublishing == 0) {
       StreetViewer.isPublishing = 1;

//       var pos = $("#main_image").position();
//       var localCoords = {
//           "x": pos.left,
//           "y": pos.top
//       };
//       var globalCoords = tiledSurface.getGlobalCoords(tiledSurface.tileOrigin, localCoords);
//       StreetViewer.publishImage(StreetViewer.images[StreetViewer.currentPreviewID], globalCoords);
//
//       setTimeout(function() {
//           console.log("function ispublishing");
//           StreetViewer.isPublishing = 0;
//       }, StreetViewer.publishFrequency);
   }
};

StreetViewer.addMarker = function(uuid, position) {
    if (arguments.length < 2) {
        var position = StreetViewer.map.getCenter();
        var uuid = guid();
    }
    
    var marker = new google.maps.Marker({
        position: position,
        draggable: true
    });

    marker.setMap(StreetViewer.map);
    
    marker.set("id", uuid);
    StreetViewer.markers[uuid] = marker;

    google.maps.event.addListener(marker, 'dragend', function(event) {
        console.log("marker moved");
        
        // send marker to channel
        var params = {};
        params.id = uuid; //closure
        params.lat = event.latLng.lat();
        params.lng = event.latLng.lng();

        var msg = new StreetViewer.Message("maps_movemarker", null, null, params);
        StreetViewer.sendMessage(msg);
    });
    
    if (arguments.length < 2) {
        // send marker to channel
        var params = {};
        params.id = marker.get("id");
        params.lat = position.lat();
        params.lng = position.lng();
        var msg = new StreetViewer.Message("maps_addmarker", null, null, params);
        StreetViewer.sendMessage(msg);
    }
}

StreetViewer.moveMarker = function(uuid, position) {
    var marker = StreetViewer.markers[uuid];
    
    marker.setPosition(position);
}


/** UTILS **/

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}