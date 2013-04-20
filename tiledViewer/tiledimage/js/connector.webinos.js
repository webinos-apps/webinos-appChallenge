var once = false;
var eventService = null;

var callback = {};

callback.onSending = function(event, recipient) {
	//params.event, params.recipient
	console.log("onSending() to " + recipient);
};
callback.onCaching = function(event) {
	//params.event
	console.log("onCaching()");
};
callback.onDelivery = function(event, recipient) {
	//params.event, params.recipient
	console.log("onDelivery() at " + recipient);
};
callback.onTimeout = function(event, recipient) {
	//params.event, params.recipient
	console.log("onTimeout()");
};
callback.onError = function(event, recipient, error) {
	//params.event, params.recipient, params.error
	console.log("onError()" + error + " recipient: " + recipient);
};

function find() {
	webinos.discovery.findServices(new ServiceType("http://webinos.org/api/events"), {
		onFound : on_service_found
	});
}

function on_service_found(service) {
	console.log("found: " + service.serviceAddress);
	if (!once) {
		once = true;
		bind(service);
	} else {
		tiledSurface.connected = false;
		tiledSurface.setState(tiledSurface.Status.LOGIN);
		console.log("Not bound : " + service.serviceAddress);
	}
}

function bind(service) {
	service.bindService({
		onBind : function(boundService) {
			eventService = boundService;
			console.log("Bound service: " + eventService.serviceAddress);
			console.log("My App ID: " + eventService.myAppID);
			
			tiledSurface.connected = true;
			tiledSurface.addHandlers();
            tiledSurface.setState(tiledSurface.Status.PAIRING);
            
            channelImage.addHandlers();
		}
	});
}