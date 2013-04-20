communication = new webinosConnector('whatevah');

communication.on('registeredBrowser', function (data) {
	console.log('Browser Registered');
	console.log(data);
});
communication.on('eventsBound', function (data) {
	console.log('eventsBound');
	console.log(data);
});
communication.on('pinged', function (data) {
	console.log('Ping '+data.data.device+': '+data.data.time);
});
communication.on('newDevice', function (name) {
	console.log('New Device running the app: '+name+' :)');
});
communication.listen('lalala', function (data) {
	console.log('Event lalala recieved!!:');
	console.log(data);
});