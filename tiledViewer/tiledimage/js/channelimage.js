var channelImage = {

    /**
     * Initializes the tile.
     */
    initialize : function() {
        this.images = ["img/drshin.jpg", "img/fireworks.jpg", "img/sumo.jpg"];
        this.currentPreviewID = 0;
        this.overviewShown = false;

        this.currentImageURI = null;

        this.isDragged = false;
        // used for firing the publish image less frequently
        this.isPublishing = 0;
        this.publishFrequency = 300;
    },

    /**
     * Adds handlers to the XMPP connection to listen to incoming stanzas.
     */
    addHandlers : function() {
        console.log("adding handlers for channelImage");

		eventService.addWebinosEventListener(channelImage.onReceiveChannelMsg, "eu.istvank.tiledsurface.webinos.channelimage");
    },

    /**
     * Toggles a view that shows the current image in fullscreen.
     */
    toggleOverview : function() {
        channelImage.overviewShown != channelImage.overviewShown;
        if (channelImage.overviewShown == true) {
            $("#image_overview").attr("src", channelImage.currentImageURI);
        }

        $("#layer_overview").fadeToggle();
    },

    /**
     * Called whenever an event is received.
     */
    onReceiveChannelMsg : function(msg) {
        // only update the tile if the user is not currently interacting with it
        // otherwise the events might originate from the tile itself.
        if (channelImage.isDragged == false) {
        	var event = JSON.parse(msg.payload);

			console.log("loading image");
            var imageURI = event.uri;
            var imgPos = {
                "x" : parseInt(event.globalx),
                "y" : parseInt(event.globaly)
            };
            var localCoord = tiledSurface.getLocalCoords(tiledSurface.tileOrigin, imgPos);

            $("#main_image").attr("src", imageURI);
            $("#main_image").css("left", localCoord.x);
            $("#main_image").css("top", localCoord.y);

            $("#image_overview").attr("src", imageURI);

            this.currentImageURI = imageURI;
        }
        return true;
    },

    /**
     * Publishes the given imageURI to the PubSub server.
     */
    publishImage : function(imageURI, globalCoords) {
    	var payloadImage = {};
    	payloadImage.uri = imageURI;
    	payloadImage.globalx = globalCoords.x.toString();
    	payloadImage.globaly = globalCoords.y.toString();

		var ev = eventService.createWebinosEvent();
    	ev.type = "eu.istvank.tiledsurface.webinos.channelimage";
    	ev.payload = JSON.stringify(payloadImage);
    	ev.dispatchWebinosEvent(callback);
    },

    /**
     * Switches the overview to the next picture.
     */
    nextImage : function() {
        channelImage.currentPreviewID++;
        if (channelImage.currentPreviewID >= channelImage.images.length) {
            channelImage.currentPreviewID = 0;
        }

        $("#image_overview").attr("src", channelImage.images[channelImage.currentPreviewID]);
    },

    /**
     * Switches the overview to the previous picture.
     */
    previousImage : function() {
        channelImage.currentPreviewID--;
        if (channelImage.currentPreviewID < 0) {
            channelImage.currentPreviewID = channelImage.images.length - 1;
        }

        $("#image_overview").attr("src", channelImage.images[channelImage.currentPreviewID]);
    },

    /**
     * Called if the user clicks the preview image.
     */
    onPreviewClick : function(e) {
        if (e.clientX > ($(window).width() * 2 / 3)) {
            channelImage.nextImage();
        } else if (e.clientX < ($(window).width() * 1 / 3)) {
            channelImage.previousImage();
        } else {
            var pos = $("#main_image").position();
            var localCoords = {
                "x" : pos.left,
                "y" : pos.top
            };
            var globalCoords = tiledSurface.getGlobalCoords(tiledSurface.tileOrigin, localCoords);
            channelImage.publishImage(channelImage.images[channelImage.currentPreviewID], globalCoords);
        }
    },

    /**
     * Called when an element's drag starts.
     */
    onDragStart : function(evt) {
        channelImage.isDragged = true;
    },

    /**
     * Called when an element's drag ends.
     */
    onDragEnd : function(evt) {
        channelImage.isDragged = false;
    },

    /**
     * Called when an element gets dragged. Publishes its new coordinates to the server.
     */
    onDrag : function(evt) {
        if (channelImage.isPublishing == 0) {
            channelImage.isPublishing = 1;

            var pos = $("#main_image").position();
            var localCoords = {
                "x" : pos.left,
                "y" : pos.top
            };
            var globalCoords = tiledSurface.getGlobalCoords(tiledSurface.tileOrigin, localCoords);
            channelImage.publishImage(channelImage.images[channelImage.currentPreviewID], globalCoords);

            setTimeout(function() {
                console.log("function ispublishing");
                channelImage.isPublishing = 0;
            }, channelImage.publishFrequency);
        }
    }
};