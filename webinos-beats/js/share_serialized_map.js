var shareBeats = {};
var servicesArray = [];
var binded = false;

shareBeats.init = function() {
    webinosPlayers();
    getPlayers();
    console.log("Share initialized!");
    findEvents();    
}


shareBeats.change = function(channel, pos, value) {
    console.log("Change recorded on channel " + channel + " at position " + pos);
    sendEvent("beatMachine", shareBeats.serialize(channel, pos, value));
    binded = true;
}


shareBeats.updateGrid = function(newBeat){ 
    var channel = newBeat[0];
    var pos = newBeat[1];
    var value = newBeat[2];
    
    song.channels[channel].bars[pos] = value;  
    updateView(song);            
}


shareBeats.serialize = function(channel, pos, value){
    return channel + '|' + pos + '|' + value;
}


shareBeats.deserialize = function(payload){
    var channels = [];    
    channels = payload.split('|');
    channels[2] = parseInt(channels[2]);
    return channels;
}


$(document).ready(function() {
    shareBeats.init();    
});


function findEvents(){  
    webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'), {
        onFound: function (service) {
            //serviceArray.push(service);
            servicesArray[servicesArray.length] = service;
            bindEventService(service);
        }        
    });
}


function bindEventService(service) {        
    service.bind({
            onBind: function(){
                console.log("Binding to: " + service.serviceAddress);
                service.addWebinosEventListener(function(event){
                    console.log("---Event received---");
                    console.log(event);       
                    if(event.type=="beatMachine")                                                             
                        shareBeats.updateGrid(shareBeats.deserialize(event.payload));
                    if(event.type=="beatMachine-MAP"){
                        if(binded == true && event.payload == "") {
                            var map = JSON.stringify({ kick:song.channels['kick'].bars, 
                                                     snare:song.channels['snare'].bars, 
                                                     hat:song.channels['hat'].bars});
                            sendEvent("beatMachine-MAP", map);
                            getPlayers();
                        }
                        else if(event.payload != "") {
                            binded = true;
                            var map = JSON.parse(event.payload);
                            song.channels['kick'].bars = map['kick'];
                            song.channels['snare'].bars = map['snare'];
                            song.channels['hat'].bars = map['hat'];                            
                            updateView(song);
                        }
                    }
                    //
                    console.log("--------------------");                                        
                });                
                if(binded == false)
                  sendEvent("beatMachine-MAP", "");
            }
    });           
}

function sendEvent(type, payload){
    console.log("------");
    console.log(servicesArray);
     console.log("------");
    for(var i=0;i<servicesArray.length;i++){
        var ev = servicesArray[i].createWebinosEvent();
        ev.type = type;
        ev.payload = payload;
        ev.dispatchWebinosEvent(); 
    }
}


function webinosPlayers(){
    var test = {};
    var recentService;    
    $('#findService').bind('click', getPlayers);
}    


function getPlayers() {
    test = {};
    recentService = null;
    $('#playersList').empty();
    webinos.discovery.findServices(new ServiceType('http://webinos.org/api/test'),
                                                   {onFound:function (service) {
                                                       test[service.serviceAddress] = service;
                                                       $('#playersList').append($('<option>' + service.serviceAddress + '</option>'));
                                                   }});
}




