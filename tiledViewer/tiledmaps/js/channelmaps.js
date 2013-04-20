var channelMaps = {

	/**
	 * Initializes the tile.
	 */
	initialize : function() {
	},

	/**
	 * Called when the channel gets (re)started.
	 */
	onStart : function() {
		// a flag to let the channelMaps object know whether the idle event was fired after a drag
		this.dragEndFlag = false;

		if (this.map == null) {
			// query webinos for location
			webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
				onFound : this.onWebinosServiceFound
			});

			var mapOptions = {
				zoom : 15,
				center : new google.maps.LatLng(0.0, 0.0),
				mapTypeId : google.maps.MapTypeId.ROADMAP
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
	},

	onWebinosServiceFound : function(service) {
		service.bindService({
			onBind : function(boundService) {
				console.log("Bound service: " + boundService.serviceAddress);
				boundService.getCurrentPosition(channelMaps.onWebinosGeoSuccess, channelMaps.onWebinosGeoError, {});
			}
		});
	},
	
	onWebinosGeoSuccess : function(position) {
		var center = channelMaps.getLocalLatLng(position.coords.latitude, position.coords.longitude);

		channelMaps.map.setCenter(center);
	},
	
	onWebinosGeoError : function() {
		console.log("ERROR finding location, giving up")
	},

	/**
	 * Adds handlers to the server connection to listen to incoming messages.
	 */
	addHandlers : function() {
		console.log("adding handlers for channelMaps");

		eventService.addWebinosEventListener(channelMaps.onReceiveChannelMsg, "eu.istvank.tiledsurface.webinos.channelmaps");
	},

	/**
	 * Called whenever an event is received.
	 */
	onReceiveChannelMsg : function(msg) {
		console.log("onReceiveChannelMsg");

		var payloadMaps = JSON.parse(msg.payload);
		
		// first set zoom otherwise calculation of local coordinates is not accurate
		var zoom = payloadMaps.zoom;
		channelMaps.map.setZoom(zoom);
		
		var center = channelMaps.getLocalLatLng(payloadMaps.lat, payloadMaps.lon);
		channelMaps.map.setCenter(center);

		return true;
	},

	/**
	 * Returns the local latitude and longitude projection from the center of the tiledSurface system.
	 */
	getLocalLatLng : function(lat, lng) {
		var center = new google.maps.LatLng(lat, lng);
		var point = this.overlay.getProjection().fromLatLngToDivPixel(center);
		point.x = point.x + (tiledSurface.tileOrigin.x + ($(window).width() / 2));
		point.y = point.y + (tiledSurface.tileOrigin.y + ($(window).height() / 2));
		var latlng = this.overlay.getProjection().fromDivPixelToLatLng(point);
		return latlng;
	},

	/**
	 * Returns the global latitude and longitude projection from the center of the current tile.
	 */
	getGlobalLatLng : function(lat, lng) {
		var center = new google.maps.LatLng(lat, lng);
		var point = channelMaps.overlay.getProjection().fromLatLngToDivPixel(center);
		point.x = point.x - (tiledSurface.tileOrigin.x + ($(window).width() / 2));
		point.y = point.y - (tiledSurface.tileOrigin.y + ($(window).height() / 2));
		var latlng = channelMaps.overlay.getProjection().fromDivPixelToLatLng(point);
		return latlng;
	},

	/**
	 * Publishes the given imageURI to the PubSub server.
	 */
	publishMaps : function(globalCoords, zoom) {
		var payloadMaps = {};
		payloadMaps.lat = globalCoords.lat();
		payloadMaps.lon = globalCoords.lng();
		payloadMaps.zoom = zoom;

		var ev = eventService.createWebinosEvent();
		ev.type = "eu.istvank.tiledsurface.webinos.channelmaps";
		ev.payload = JSON.stringify(payloadMaps);
		ev.dispatchWebinosEvent(callback);
	},

	/**
	 * Called on map.idle events.
	 */
	onMapIdle : function(evt) {
		if (this.dragEndFlag == true) {
			console.log("onMapIdle after dragging");

			// publish new location
			var center = channelMaps.map.getCenter();
			var zoom = channelMaps.map.getZoom();
			channelMaps.publishMaps(channelMaps.getGlobalLatLng(center.lat(), center.lng()), zoom);

			this.dragEndFlag = false;
		}
	},

	/**
	 * Called on map.dragend events.
	 */
	onMapDragEnd : function(evt) {
		console.log("onDragEnd");
		this.dragEndFlag = true;
	},

	/**
	 * Called when an element gets dragged. Publishes its new coordinates to the server.
	 */
	onDrag : function(evt) {
		if (channelMaps.isPublishing == 0) {
			channelMaps.isPublishing = 1;

			var pos = $("#main_image").position();
			var localCoords = {
				"x" : pos.left,
				"y" : pos.top
			};
			var globalCoords = tiledSurface.getGlobalCoords(tiledSurface.tileOrigin, localCoords);
			channelMaps.publishImage(channelMaps.images[channelMaps.currentPreviewID], globalCoords);

			setTimeout(function() {
				console.log("function ispublishing");
				channelMaps.isPublishing = 0;
			}, channelMaps.publishFrequency);
		}
	}
};
