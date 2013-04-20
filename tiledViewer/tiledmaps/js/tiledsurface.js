/*
 * The main app class.
 */
var tiledSurface = {

	/**
	 * The state of the current tile.
	 */
	Status : {
		ERROR : 0,
		IDLE : 1,
		LOGIN : 2,
		CONNECTING : 3,
		PAIRING : 4,
		RECONFIGURING : 5,
		RUNNING : 6
	},

	/**
	 * Initializes the tile.
	 */
	initialize : function() {
		// initialize the tile
		this.canvas = $("#pairing_canvas");
		this.adjustCanvasSize();
		this.isDrawing = false;
		this.connected = false;
		this.tileStrokes = [];
		this.state = this.Status.IDLE;
		// contains the global coordinates of the tiles
		this.tileConfiguration = {};
		this.globalCenterX = 0;
		this.globalCenterY = 0;
		this.globalWidth = 0;
		this.globalHeight = 0;
		this.tileOrigin = null;

		// attach the window.resize handler.
		$(window).on("resize", this.adjustCanvasSize);

		// attach the touchstart, touchmove, touchend event listeners.
		this.canvas.on('touchstart', this.draw);
		this.canvas.on('touchmove', this.draw);
		this.canvas.on('touchend', this.draw);
		// add mousemove listeners
		this.canvas.on('mousedown', this.draw);
		this.canvas.on('mousemove', this.draw);
		this.canvas.on('mouseup', this.draw);
	},

	/**
	 * Gets called on window.resize.
	 */
	adjustCanvasSize : function() {
		console.log("changing canvas size");

		// send resize message if tile is connected
		if (tiledSurface.connected == true) {

			var payloadResize = {};
			payloadResize.width = $(window).width().toString();
			payloadResize.height = $(window).height().toString();

			var ev = eventService.createWebinosEvent();
			ev.type = "eu.istvank.tiledsurface.webinos.resize";
			ev.payload = JSON.stringify(payloadResize);
			ev.dispatchWebinosEvent(callback);
		}

		tiledSurface.canvas[0].width = $(window).width();
		tiledSurface.canvas[0].height = $(window).height();

		tiledSurface.drawContext = tiledSurface.canvas[0].getContext("2d");
		tiledSurface.drawContext.lineCap = "round";
		tiledSurface.drawContext.lineWidth = 50;

		if (tiledSurface.state < tiledSurface.Status.RUNNING) {
			$("#toolbar").position({
				"my" : "center center",
				"at" : "center center",
				"of" : $("#container")
			});
		} else {
			$("#toolbar").position({
				"my" : "right top",
				"at" : "right top",
				"of" : $("#container")
			});
		}
	},

	/**
	 * Logs out of the XMPP network.
	 */
	disconnect : function() {
		//TODO: eventService.removeWebinosEventListener(listenerID);

		tiledSurface.setState(tiledSurface.Status.LOGIN);
	},

	/**
	 * Resets the configuration of the tiles and shows the pairing mode.
	 */
	resetConfiguration : function() {
		// send out reset messages to all tiles
		var ev = eventService.createWebinosEvent();
		ev.type = "eu.istvank.tiledsurface.webinos.reset";
		ev.dispatchWebinosEvent(callback);

		console.log("sent reset msg");

		tiledSurface.tileStrokes = [];
		tiledSurface.tileConfiguration = {};

		tiledSurface.setState(tiledSurface.Status.PAIRING);
	},

	/**
	 * The drawer object contains methods for the different touch events on the canvas.
	 * Draws a line on the canvas.
	 */
	drawer : {
		isDrawing : false,
		firstCoors : null,
		lastCoors : null,
		touchstart : function(context, coors) {
			context.beginPath();
			context.moveTo(coors.x, coors.y);
			firstCoors = coors;
			this.isDrawing = true;
		},
		touchmove : function(context, coors) {
			if (this.isDrawing) {
				context.lineTo(coors.x, coors.y);
				context.stroke();
				lastCoors = coors;
			}
		},
		touchend : function(context) {
			this.isDrawing = false;
			tiledSurface.onStrokeDrawn(firstCoors, lastCoors);
		},
		// for mouse events
		mousedown : function(context, coors) {
			context.beginPath();
			context.moveTo(coors.x, coors.y);
			firstCoors = coors;
			this.isDrawing = true;
		},
		mousemove : function(context, coors) {
			if (this.isDrawing) {
				context.lineTo(coors.x, coors.y);
				context.stroke();
				lastCoors = coors;
			}
		},
		mouseup : function(context) {
			this.isDrawing = false;
			tiledSurface.onStrokeDrawn(firstCoors, lastCoors);
		}
	},

	/**
	 * Called when a touch event has occured on the canvas. Call the "drawer" method
	 * that actually draws a line on the canvas.
	 */
	draw : function(event) {
		var e = event.originalEvent;
		var isTouchSupported = 'ontouchstart' in window.document;

		if (isTouchSupported) {
			// get the touch coordinates
			if (e.type != "touchend") {
				var coors = {
					x : e.targetTouches[0].pageX,
					y : e.targetTouches[0].pageY
				};
				e.preventDefault();
			}
		} else {
			// get the mouse coordinates
			if (e.type != "mouseup") {
				var coors = {
					x : e.pageX,
					y : e.pageY
				};
				e.preventDefault();
			}
		}
		// pass the coordinates to the appropriate handler
		tiledSurface.drawer[e.type](tiledSurface.drawContext, coors);
	},

	/**
	 * Adds handlers to the XMPP connection to listen to incoming stanzas.
	 */
	addHandlers : function() {
		console.log("adding handlers");

		eventService.addWebinosEventListener(tiledSurface.onReceiveStrokeMsg, "eu.istvank.tiledsurface.webinos.stroke");
		eventService.addWebinosEventListener(tiledSurface.onReceiveConfigMsg, "eu.istvank.tiledsurface.webinos.config");
		eventService.addWebinosEventListener(tiledSurface.onReceiveResetMsg, "eu.istvank.tiledsurface.webinos.reset");
		eventService.addWebinosEventListener(tiledSurface.onReceiveReconfigTileMsg, "eu.istvank.tiledsurface.webinos.reconfigtile");
		eventService.addWebinosEventListener(tiledSurface.onReceiveReconfigMsg, "eu.istvank.tiledsurface.webinos.reconfig");
	},

	/**
	 * Changes from one state to another.
	 */
	setState : function(newState) {
		switch (newState) {
			case tiledSurface.Status.ERROR:
				break;
			case tiledSurface.Status.IDLE:
				break;
			case tiledSurface.Status.LOGIN:
				$("#start").fadeIn(1000);
				$("#reconfig").fadeOut(1000);
				$("#pairing_canvas").fadeOut(1000);
				$("#tile_content").fadeOut(1000);
				$("#toolbar_channel").fadeOut(1000);
				tiledSurface.showLoginDialog();
				break;
			case tiledSurface.Status.PAIRING:
				$("#start").fadeIn(1000);
				$("#reconfig").fadeOut(1000);
				$("#tile_content").fadeOut(1000);
				$("#toolbar_channel").fadeOut(1000);
				$("#pairing_canvas").fadeIn(1000);

				// clear canvas
				tiledSurface.adjustCanvasSize();

				// move toolbar to center
				$("#toolbar").position({
					"my" : "center center",
					"at" : "center center",
					"of" : $("#container")
				});
				break;
			case tiledSurface.Status.RECONFIGURING:
				$("#start").fadeIn(1000);
				$("#reconfig").fadeOut(1000);
				$("#tile_content").fadeOut(1000);
				$("#toolbar_channel").fadeOut(1000);
				$("#pairing_canvas").fadeIn(1000);

				// move toolbar to center
				$("#toolbar").position({
					"my" : "center center",
					"at" : "center center",
					"of" : $("#container")
				});

				break;
			case tiledSurface.Status.RUNNING:
				$("#start").fadeOut(1000);
				$("#reconfig").fadeIn(1000);
				// disable the drawing canvas
				$("#pairing_canvas").fadeOut(1000);

				// enable content
				$("#tile_content").fadeIn(1000);
				$("#toolbar_channel").fadeIn(1000);

				// move toolbar to top right
				$("#toolbar").position({
					"my" : "right top",
					"at" : "right top",
					"of" : $("#container")
				});

				$("#toolbar_channel").position({
					"my" : "left top",
					"at" : "left top",
					"of" : $("body")
				});

				// (re)start channel
				channelMaps.onStart();

				break;
			default:
				console.log("unknown state");
				break;
		}
		tiledSurface.state = newState;
	},

	/**
	 * Shows the login dialog.
	 */
	showLoginDialog : function() {
		$("#login_dialog").dialog({
			autoOpen : true,
			draggable : true,
			modal : true,
			title : "Connect to PZP",
			buttons : {
				"Bind" : function() {
					find();

					$(this).dialog("close");
				}
			}
		});
	},

	/**
	 * Sends the normalized edge coordinates to all tiles.
	 * Called when a stroke was drawn.
	 * @param {Object} lastCoors the coordinates of the first touch
	 * @param {Object} lastCoors the coordinates of the last touch
	 */
	onStrokeDrawn : function(firstCoors, lastCoors) {
		var x, y, direction;

		if (Math.abs(lastCoors.x - firstCoors.x) < (Math.abs(lastCoors.y - firstCoors.y))) {
			// a vertical stroke was made
			direction = "vertical";
			x = lastCoors.x;
			if (lastCoors.y < ($(window).height() / 2)) {
				// stroke ends on top
				y = 0;
			} else {
				// stroke ends on bottom
				y = $(window).height();
			}
		} else {
			// a horizontal stroke was made
			direction = "horizontal";
			y = lastCoors.y;
			if (lastCoors.x < ($(window).width() / 2)) {
				// stroke ends on left
				x = 0;
			} else {
				// stroke ends on right
				x = $(window).width();
			}
		}

		var payloadStroke = {};
		payloadStroke.width = $(window).width().toString();
		payloadStroke.height = $(window).height().toString();
		payloadStroke.direction = direction;
		payloadStroke.coordx = x.toString();
		payloadStroke.coordy = y.toString();

		// set border values
		//TODO: calculate real borders
		payloadStroke.borderLeft = "110";
		payloadStroke.borderRight = "110";
		payloadStroke.borderTop = "90";
		payloadStroke.borderBottom = "90";

		var ev = eventService.createWebinosEvent();
		ev.type = "eu.istvank.tiledsurface.webinos.stroke";
		ev.payload = JSON.stringify(payloadStroke);
		ev.dispatchWebinosEvent(callback);
	},

	/**
	 * Analyzes an incoming stroke message and saves its data to the config array.
	 */
	onReceiveStrokeMsg : function(msg) {
		console.log("received stroke msg");

		var event = JSON.parse(msg.payload);

		var tileConfig = {};
		tileConfig.jid = msg.addressing.source.id;
		tileConfig.width = parseInt(event.width);
		tileConfig.height = parseInt(event.height);
		tileConfig.direction = event.direction;
		tileConfig.coordx = parseInt(event.coordx);
		tileConfig.coordy = parseInt(event.coordy);

		tileConfig.borderLeft = parseInt(event.borderLeft);
		tileConfig.borderRight = parseInt(event.borderRight);
		tileConfig.borderTop = parseInt(event.borderTop);
		tileConfig.borderBottom = parseInt(event.borderBottom);

		// save in array
		tiledSurface.tileStrokes.push(tileConfig);

		// match tiles
		tiledSurface.matchTiles();

		// return true so Strophe won't remove the handler
		return true;
	},

	/**
	 * Saves the incoming configuration and disables the canvas.
	 */
	onReceiveConfigMsg : function(msg) {

		var event = JSON.parse(msg.payload);

		// save config values
		tiledSurface.globalWidth = parseInt(event.globalWidth);
		tiledSurface.globalHeight = parseInt(event.globalHeight);
		var tileCoords = {};
		tileCoords.x = parseInt(event.tileX);
		tileCoords.y = parseInt(event.tileY);
		tiledSurface.tileOrigin = tileCoords;

		tiledSurface.setState(tiledSurface.Status.RUNNING);

		return true;
	},

	/**
	 * Resets the tile configuration for all tiles.
	 */
	onReceiveResetMsg : function(msg) {
		tiledSurface.resetConfiguration();

		return true;
	},

	/**
	 * Resets the tile configuration of a single tile. Received by the master tile,
	 * deletes the configuration of the sending tile and sends reconfig messages to
	 * all tiles.
	 */
	onReceiveReconfigTileMsg : function(msg) {
		$.each(tiledSurface.tileConfiguration, function(key, value) {
			// key is the recipient
			var ev = eventService.createWebinosEvent();
			ev.addressing = {};
			var webinosAddressings = [];
			webinosAddressings[0] = {};
			webinosAddressings[0].id = key;
			ev.addressing.to = webinosAddressings;
			ev.type = "eu.istvank.tiledsurface.webinos.reconfig";
			ev.dispatchWebinosEvent(callback);

			console.log("sent reconfig msg to " + key);
		});

		tiledSurface.tileConfiguration[eventService.myAppID] = null;
		tiledSurface.tileStrokes = [];

		return true;
	},

	/**
	 * Shows the drawing canvas.
	 */
	onReceiveReconfigMsg : function(msg) {
		tiledSurface.setState(tiledSurface.Status.RECONFIGURING);

		return true;
	},

	/**
	 * Goes through the list of saved tile configurations and links them.
	 */
	matchTiles : function() {
		console.log("matchTiles");
		// run through tile configurations
		$.each(tiledSurface.tileStrokes, function(keyFirst, valueFirst) {
			// run through the rest of the array to find matches
			for (var i = (keyFirst + 1); i < tiledSurface.tileStrokes.length; i++) {
				// check if the two strokes originate from the same device
				if (valueFirst.jid !== tiledSurface.tileStrokes[i].jid) {
					console.log("comparing " + valueFirst.jid + " against " + tiledSurface.tileStrokes[i].jid);

					// check equal direction
					if (valueFirst.direction === tiledSurface.tileStrokes[i].direction) {
						if (valueFirst.direction === "horizontal") {
							// horizontal stroke
							if (valueFirst.coordx !== tiledSurface.tileStrokes[i].coordx) {
								// found match!
								console.log("match");

								// assign them global coordinates
								tiledSurface.arrangeTiles(valueFirst, tiledSurface.tileStrokes[i]);

								// remove higher index first
								tiledSurface.tileStrokes.splice(i, 1);
								tiledSurface.tileStrokes.splice(keyFirst, 1);
								return false;
							}
						} else {
							// vertical stroke
							if (valueFirst.coordy !== tiledSurface.tileStrokes[i].coordy) {
								// found match!
								console.log("match");

								// assign them global coordinates
								tiledSurface.arrangeTiles(valueFirst, tiledSurface.tileStrokes[i]);

								// remove higher index first
								tiledSurface.tileStrokes.splice(i, 1);
								tiledSurface.tileStrokes.splice(keyFirst, 1);
								return false;
							}
						}
					}
				}
			}
		});
	},

	/**
	 * Calculates the global coordinates of two tiles by their strokes.
	 */
	arrangeTiles : function(strokeOne, strokeTwo) {
		var tileConfigOne = tiledSurface.tileConfiguration[strokeOne.jid];
		var tileConfigTwo = tiledSurface.tileConfiguration[strokeTwo.jid];
		if ((tileConfigOne != null) && (tileConfigTwo != null)) {
			// both tiles are already in configuration
			//TODO: check for circular dependencies, if none, move one branch
		} else {
			// either both are or one of them is not yet in config
			if ((tileConfigOne != null) && (tileConfigTwo == null)) {
				// first is already in config, use its previous configuration
				tileConfigTwo = {};
			} else if ((tileConfigOne == null) && (tileConfigTwo != null)) {
				// second is already in config, swap variables
				var tempStroke = strokeOne;
				strokeOne = strokeTwo;
				strokeTwo = tempStroke;
				tileConfigOne = tileConfigTwo;
				tileConfigTwo = {};
			} else {
				// none of them are in config
				// set first tile to 0, 0
				tileConfigOne = {};
				tileConfigTwo = {};
				tileConfigOne.globalX = 0;
				tileConfigOne.globalY = 0;
			}

			tileConfigOne.width = strokeOne.width;
			tileConfigOne.height = strokeOne.height;
			tileConfigOne.borderLeft = strokeOne.borderLeft;
			tileConfigOne.borderRight = strokeOne.borderRight;
			tileConfigOne.borderTop = strokeOne.borderTop;
			tileConfigOne.borderBottom = strokeOne.borderBottom;

			tileConfigTwo.width = strokeTwo.width;
			tileConfigTwo.height = strokeTwo.height;
			tileConfigTwo.borderLeft = strokeTwo.borderLeft;
			tileConfigTwo.borderRight = strokeTwo.borderRight;
			tileConfigTwo.borderTop = strokeTwo.borderTop;
			tileConfigTwo.borderBottom = strokeTwo.borderBottom;

			if (strokeOne.direction === "horizontal") {
				// horizontal
				tileConfigTwo.globalY = tileConfigOne.globalY + strokeOne.coordy - strokeTwo.coordy;
				if (strokeOne.coordx == 0) {
					// position second tile to the left
					tileConfigTwo.globalX = (tileConfigOne.globalX - tileConfigOne.borderLeft) - (tileConfigTwo.width + tileConfigTwo.borderRight);
				} else {
					// position second tile to the right
					tileConfigTwo.globalX = tileConfigOne.globalX + tileConfigOne.width + tileConfigOne.borderRight + tileConfigTwo.borderLeft;
				}
			} else {
				// vertical
				tileConfigTwo.globalX = tileConfigOne.globalX + strokeOne.coordx - strokeTwo.coordx;
				if (strokeOne.coordy == 0) {
					// position second tile to the top
					tileConfigTwo.globalY = (tileConfigOne.globalY - tileConfigOne.borderTop) - (tileConfigTwo.height + tileConfigTwo.borderBottom);
				} else {
					// position second tile to the bottom
					tileConfigTwo.globalY = tileConfigOne.globalY + tileConfigOne.height + tileConfigOne.borderBottom + tileConfigTwo.borderTop;
				}
			}

			// save configuration
			tiledSurface.tileConfiguration[strokeOne.jid] = tileConfigOne;
			tiledSurface.tileConfiguration[strokeTwo.jid] = tileConfigTwo;
		}

		console.log("tile configuration: " + JSON.stringify(tiledSurface.tileConfiguration));
	},

	/**
	 * Takes the list of tile configurations and calculates the global origin.
	 */
	calculateGlobalOrigin : function() {
		// start with 0, as the first tile was initialized with 0.
		var left = 0, top = 0, right = 0, bottom = 0;
		$.each(tiledSurface.tileConfiguration, function(key, value) {
			if (value.globalX < left) {
				left = value.globalX;
			}
			if ((value.globalX + value.width) > right) {
				right = value.globalX + value.width;
			}
			if (value.globalY < top) {
				top = value.globalY;
			}
			if ((value.globalY + value.height) > bottom) {
				bottom = value.globalY + value.height;
			}
		});

		// now calculate the global dimensions and center
		tiledSurface.globalWidth = (right - left);
		tiledSurface.globalHeight = (bottom - top);
		tiledSurface.globalCenterX = Math.floor((right + left) / 2);
		tiledSurface.globalCenterY = Math.floor((bottom + top) / 2);
	},

	/**
	 * Takes the global origin, sets it to 0,0 and calculates the tile configurations
	 * accordingly.
	 */
	normalizeGlobalCoords : function() {
		$.each(tiledSurface.tileConfiguration, function(key, value) {
			value.globalX -= tiledSurface.globalCenterX;
			value.globalY -= tiledSurface.globalCenterY;
		});

		tiledSurface.globalCenterX = 0;
		tiledSurface.globalCenterY = 0;
	},

	/**
	 * Sends out messages to the tiles including their global configuration to start the actual
	 * content.
	 */
	startContent : function() {
		console.log("starting");
		tiledSurface.calculateGlobalOrigin();
		tiledSurface.normalizeGlobalCoords();

		// send out messages to all tiles
		$.each(tiledSurface.tileConfiguration, function(key, value) {
			// key is the recipient

			var payloadConfig = {};
			payloadConfig.globalWidth = tiledSurface.globalWidth.toString();
			payloadConfig.globalHeight = tiledSurface.globalHeight.toString();
			payloadConfig.globalCenterX = tiledSurface.globalCenterX.toString();
			payloadConfig.globalCenterY = tiledSurface.globalCenterY.toString();
			payloadConfig.tileX = value.globalX.toString();
			payloadConfig.tileY = value.globalY.toString();

			var ev = eventService.createWebinosEvent();
			ev.addressing = {};
			var webinosAddressings = [];
			webinosAddressings[0] = {};
			webinosAddressings[0].id = key;
			ev.addressing.to = webinosAddressings;
			ev.type = "eu.istvank.tiledsurface.webinos.config";
			ev.payload = JSON.stringify(payloadConfig);
			ev.dispatchWebinosEvent(callback);
		});
	},

	/**
	 * Gets the local coords to global coords depending on the global center.
	 * @param {Object} tileOrigin the coordinates of the tile in the global coordinate system
	 * @param {Object} globalCoords the global coordinates to find the local coordinates to
	 * @return {Object} the local coordinates of the global coordinates supplied
	 */
	getLocalCoords : function(tileOrigin, globalCoords) {
		var coords = {
			"x" : (globalCoords.x - tileOrigin.x),
			"y" : (globalCoords.y - tileOrigin.y)
		};
		return coords;
	},

	/**
	 * Gets the global coords to local coords depending on the global center.
	 * @param {Object} tileOrigin the coordinates of the tile in the global coordinate system
	 * @param {Object} localCoords the local coordinates to find the global coordinates to
	 * @return {Object} the global coordinates of the local coordinates supplied
	 */
	getGlobalCoords : function(tileOrigin, localCoords) {
		var coords = {
			"x" : (localCoords.x + tileOrigin.x),
			"y" : (localCoords.y + tileOrigin.y)
		};
		return coords;
	},

	/**
	 * Sends a message to the master tile with the wish to reposition this single tile.
	 */
	reconfig : function() {
		var ev = eventService.createWebinosEvent();
		ev.type = "eu.istvank.tiledsurface.webinos.reconfigtile";
		ev.dispatchWebinosEvent(callback);

		console.log("sent reconfigure msg");

		// clear canvas
		tiledSurface.adjustCanvasSize();
	}
};

