CoreApp = {
    Device: {
      Name: function(){
          if(!localStorage.deviceName){
              localStorage.deviceName = webinos.session.getPZPId();
          }
          return localStorage.deviceName;
      }
    },
    init: function(){
        $(document).bind('pageshow', function (e) {
            if (e.target.id == "Settings") {
                CoreApp.Settings.init();
            }else if (e.target.id == "Home") {
                CoreApp.Home.init();
            }
        });
        $(document).bind('pageinit', function(e){
            if (e.target.id=="Controller-local"){
                CoreApp.LocalFs.init();// Initialize only the first time
            }else if (e.target.id=="Controller-youtube"){
                CoreApp.YouTube.init();// Initialize only the first time
            }
        });

        //Call the init of Homepage
        CoreApp.Home.init();
        // Initialize webinos (not it's loaded in the end)
        // CoreApp.Webinos.File.init();
        //  CoreApp.Webinos.Msg.init();
    },
    onError: function(error){
      console.log("Error: " + error.message + " (Code: #" + error.code + ")");
    },
    alert: function(title,content){
        $('<div>').simpledialog2({
            mode: 'blank',
            headerText: title,
            headerClose: true,
            blankContent  : content +'<br/>' +
                "<a rel='close' data-role='button' href='#'>Close</a>"
        });
    },
    readEntry: function(entry, cb, getUrl){
        var reader = new FileReader();
        reader.onerror = CoreApp.onError;
        reader.onload = function(evt){
            cb(evt.srcElement.result)
        };
        entry.file(function(file){
            // Initiate call
            if (getUrl)
                reader.readAsDataURL(file);
            else
                reader.readAsBinaryString(file);
        }, CoreApp.onError);
        // Create a blob link
    },
    chunkSize: 2048,
    LocalFs: {
      supportedVideoExts: [
          "mp4","ogv","webm","ogg","anx"
      ],
      supportedImageExts: [
          "jpg","gif","png"
      ],
      init: function(){
          try{
            CoreApp.LocalFs.loadDir(CoreApp.Webinos.File.Root);
          }catch(ex){ // If file api fails (e.g. android) add an empty folder
             console.log("Error ");
             console.log(ex);
             CoreApp.LocalFs.addDirectory(null,"parentFolder", ". .");
          }
      },
      getFolderTemplate: function(id, description){
          var output = '<li data-icon="false">';
          output += '<a id="'+ id + '" class="Folder">';
          output += '<img class="ui-li-icon" src="images/Folder.png" alt="'+description + '">';
          output += description;
          output += '</a></li>';
          return output;
      },
      getFileTemplate: function(id, description, icon){
          var output = '<li data-icon="false">';
          output += '<a id="'+ id + '" class="File">';
          output += '<img class="ui-li-icon" src="images/'+ icon +'.png" alt="'+description + '">';
          output += description;
          output += '</a></li>';
          return output;
      },
      loadDir: function(directory){
          $("#activePath").text("Current folder: " + directory.fullPath);
          $("#fileFs").empty();
          directory.getParent(
              function (parent) {
                  if (directory.fullPath!="/"){ // Show only if no upper level exists
                      CoreApp.LocalFs.addDirectory(parent,"parentFolder", "..");
                  }
              }
          );

          var reader = directory.createReader();
          reader.readEntries(CoreApp.LocalFs.parseReaderEntries, function(error){console.log("Error reading directory (#" + error.name + ")")});
      },
      addDirectory: function(dir, id, description){
            var content =  CoreApp.LocalFs.getFolderTemplate(id,description);
            $('#fileFs').append(content);
            $('#'+id).click(CoreApp.LocalFs.loadDir.bind(this, dir));
      },
      parseReaderEntries:  function(entries) {
            var i = 0;
            entries.forEach(
                function (entry) {
                    var id = "entry" + (++i);
                    if (entry.isDirectory){
                        CoreApp.LocalFs.addDirectory(entry,id,entry.name);
                    }else{
                        ext = entry.name.split('.').pop();
                        if ($.inArray(ext, CoreApp.LocalFs.supportedVideoExts)>=0){
                            icon = "Video-File";
                        } else if ($.inArray(ext, CoreApp.LocalFs.supportedImageExts)>=0){
                            icon = "Image-File";
                        }else{
                            icon = "Unknown-File";
                        }
                        var content =  CoreApp.LocalFs.getFileTemplate(id,entry.name, icon);
                        $('#fileFs').append(content);
                        if (icon=="Video-File"){
                            $('#'+id).click(function(){
                                CoreApp.LocalFs.showVideoDialog(entry);
                            });//TODO Send file
                        }else if (icon=="Image-File"){
                            $('#'+id).click(function(){
                                CoreApp.LocalFs.showPictureDialog(entry);}
                            );
                        }else {
                            $('#'+id).click(function(){
                                CoreApp.alert('Unsupported', '<div>'+
                                        'File ' + entry.name + ' is not supported by webinos projector'+
                                        '</div>');
                            });
                        }
                    }
                }
            );
            $('#fileFs').append("<li></li>");
            $('#fileFs').listview('refresh');
        },
        showPictureDialog: function(entry){
            $('<div>').simpledialog2({
                mode: 'button',
                headerText: 'Select time',
                buttonPrompt : '<div data-role="fieldcontain">'+
                    'Show picture ' + entry.name + ' for (sec):'+
                    '<br/>'+
                    '<input id="timePicker" type="range" name="slider" value="10" min="2" max="120" data-highlight="false" />'+
                    '</div>'+
                    "<a rel='close' data-role='button' href='#'>Cancel</a>",
                buttons : {
                    'OK': {
                        click: function () {
                            CoreApp.readEntry(entry, function(link){
                                CoreApp.Communication.sendImage(entry.name,$("#timePicker").val(),link);
                            }, true);
                        }
                    }
                }
            });
        },
        showVideoDialog: function(entry){
            $('<div>').simpledialog2({
                mode: 'button',
                headerText: 'Send video?',
                buttonPrompt : '<div data-role="fieldcontain">'+
                    'Send the video ' + entry.name + '?' +
                    '<br/></div>'+
                    "<a rel='close' data-role='button' href='#'>Cancel</a>",
                buttons : {
                    'OK': {
                        click: function () {
                            CoreApp.readEntry(entry, function(link){
                                // Notify partial sending of file
                                CoreApp.Communication.sendVideoStart(entry.name);
                                var counter = 0;
                                for (var i = 0; i < link.length; i = i + CoreApp.chunkSize){
                                    CoreApp.Communication.sendVideo(entry.name,link.substring(i,i+CoreApp.chunkSize), counter);
                                    counter++;
                                }
                                // Finish sending video
                                CoreApp.Communication.sendVideoEnd(entry.name,counter);
                            }, true);
                        }
                    }
                }
            });
        }
    },
    YouTube: {
      init: function(){
        $("#cmdSearchYoutube").click(CoreApp.YouTube.DoSearch);
        $(".youtubeResultVideo").live("click", function(){
            CoreApp.Communication.sendYouTube($(this).attr("data-youtube"),$("label",this).html(), $("img",this).attr("src"))
        });
      },
      DoSearch: function(){
          var searchTerm  = $("#searchYoutube").val();
          if (searchTerm && searchTerm!=""){
              $('#youtubeResults').html("");
              $('#youtubeResults').append(CoreApp.YouTube.Templates.header);
              $('#youtubeResults').append(CoreApp.YouTube.Templates.searching);
              $('#youtubeResults').listview('refresh');
              Youtube.searchYoutube(searchTerm,CoreApp.YouTube.ShowResults);
          }else{
              CoreApp.alert("Error","<div>Please select something to search for</div>");
          }
      },
      Templates:{
        header: '<li data-role="list-divider" role="heading">Youtube results</li>',
        searching: '<li><img src="theme/images/youtube-loader.gif" alt=""/>Searching...</li>',
        noResults: '<li>No results</li>'
      },
      ShowResults: function(resp){
          $('#youtubeResults').html("");
          $('#youtubeResults').append(CoreApp.YouTube.Templates.header);
          if (resp.items.length>0)
              $.each(resp.items, function(index,value){
                  $('#youtubeResults').append("<a href='#' class='youtubeResultVideo' data-youtube='" + value.id.videoId + "'><li><img src='"+ value.snippet.thumbnails.default.url +"' alt=''/><label>"+ value.snippet.title +"'</label></a></li>");
              });
          else
              $('#youtubeResults').append(CoreApp.YouTube.Templates.noResults);

          $('#youtubeResults').listview('refresh');
      }
    },
    Home: {
        init: function(){
            $("#videoPlayer").click(function(){ // redirect to custom page for video player
                window.location = "projector.html";
            });
            CoreApp.Home.refreshDeviceName();
        },
        refreshDeviceName: function(){
            $("#device-name").text(CoreApp.Device.Name());
        }
    },
    Communication:{
       sendImage: function(name, duration, content){
           CoreApp.Webinos.Msg.send("add-image", { title: name, link: content, duration: duration});
       },
       sendVideoStart: function(name){
           CoreApp.Webinos.Msg.send("clear-video", { title: name});
       },
       sendVideo: function(name, content, chunkId){
           CoreApp.Webinos.Msg.send("add-video", { title: name, link: content, chunkId: chunkId});
       },
       sendVideoEnd: function(name, numberOfChunks){
           CoreApp.Webinos.Msg.send("add-video-finish", { title: name, chunks: numberOfChunks});
       },
       sendYouTube: function(videoId,title, imgUrl){
           CoreApp.Webinos.Msg.send("add-youtube", {link: "https://www.youtube.com/watch?v=" + videoId, title: title, poster: imgUrl});
       }
    },
    Webinos: {
      Msg: {
          messageHandler: function(from, type, msg){ //The application will have to add a custom parser
            console.log("must override CoreApp.Webinos.Msg.messageHandler");
          },
          myHost:{},
          messagePrefix:"Projector_", //A prefix on all event types to avoid receiving events from other apps
          service:null,
          eventListenerId:null,
          init:function () { // Binds the event API
              // Find service
              webinos.ServiceDiscovery.findServices(
                  new ServiceType('http://webinos.org/api/events'),
                  {
                      onFound:function (service) {
                          // If this is the local pzh
                          if (service.serviceAddress == webinos.session.getPZHId())
                          service.bind({// Bind the service
                              onBind:function (service) {
                                  //Clear the previous one
                                  CoreApp.Webinos.Msg.clear();
                                  //And assign the new
                                  CoreApp.Webinos.Msg.service = service;
                                  CoreApp.Webinos.Msg.eventListenerId = service.addWebinosEventListener(CoreApp.Webinos.Msg.eventReceived);
                                  //And set the host for this instance
                                  CoreApp.Webinos.Msg.myHost = CoreApp.Webinos.Msg.parseFromPeer(CoreApp.Webinos.Msg.service.myAppID);
                              }
                          });
                      },
                      onError:function (error) {
                          CoreApp.Webinos.Msg.clear();
                          CoreApp.onError(error);
                      }
                  }
              );
          },
          clear:function () {//Clear the api
              //Try to remove the Event Listener
              if (CoreApp.Webinos.Msg.service != null && CoreApp.Webinos.Msg.eventListenerId != null) {
                  try {
                      CoreApp.Webinos.Msg.service.removeWebinosEventListener(CoreApp.Webinos.Msg.eventListenerId);
                  } catch (error) {
                      //This is normal if we have disconnected the pzh
                  }
              }
              CoreApp.Webinos.Msg.service = null;
              CoreApp.Webinos.Msg.eventListenerId = null;
          },
          eventReceived:function (event) {
              // If it's the event I send, ignore it
              if (event.addressing.source.id === CoreApp.Webinos.Msg.service.myAppID) return;
              //Ignore events from other applications
              if (event.type.substring(0, CoreApp.Webinos.Msg.messagePrefix.length) != CoreApp.Webinos.Msg.messagePrefix) return;
              //Get the pure event type
              var type = event.type.substring(CoreApp.Webinos.Msg.messagePrefix.length);
              CoreApp.Webinos.Msg.messageHandler(CoreApp.Webinos.Msg.parseFromPeer(event.addressing.source.id), type, event.payload);
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
              if (CoreApp.Webinos.Msg.service != null) {
                  var event = CoreApp.Webinos.Msg.service.createWebinosEvent();
                  event.type = CoreApp.Webinos.Msg.messagePrefix + type;
                  event.payload = msg;
                  event.dispatchWebinosEvent();
              }
          }
      },
      File: {
          Id: null,
          Root: null,
          serviceFound: function(service){
              // If this is the local device
              if (service.serviceAddress == webinos.session.getPZPId())
              service.bindService({
                  onBind: function () {
                      service.requestFileSystem(
                          1
                          ,1024
                          ,function (filesystem) {
                              CoreApp.Webinos.File.Id = service.id;
                              CoreApp.Webinos.File.Root = filesystem.root;
                              console.log(filesystem.root);
                          }
                          ,CoreApp.onError
                      );
                  }
              });
          },
          serviceLost: function(service){
              if (service.id == CoreApp.Webinos.File.Id)
                CoreApp.Webinos.File.Root = null;
          },
          init: function(){
              webinos.discovery.findServices(
                  new ServiceType("http://webinos.org/api/file")
                  ,{
                      onFound: CoreApp.Webinos.File.serviceFound
                      ,onLost: CoreApp.Webinos.File.serviceLost
                      ,onError: CoreApp.onError
                  }
              );
          }
      }
    },
    Settings: {
        init: function(){
            $("#textinput-device-name").val(CoreApp.Device.Name());
            $("#cmdSaveSettings").click(CoreApp.Settings.SaveSettings);
        },
        SaveSettings: function(){
            if ($("#textinput-device-name").val()){
            localStorage.deviceName = $("#textinput-device-name").val();
            $('<div>').simpledialog2({
                   mode: 'button',
                   headerText: 'Saved',
                   buttonPrompt : "This device is now named " + localStorage.deviceName,
                   buttons : {
                    'OK': {
                        click: function () {
                            $.mobile.changePage("#Home");
                        }
                    }
                   }
            });
            }else{
                // Set the php name
                $("#textinput-device-name").val(webinos.session.getPZPId());
                $('<div>').simpledialog2({
                    mode: 'blank',
                    headerText: 'Failed',
                    blankContent :
                        "<p>You must type a name for this device</p>"+
                            // NOTE: the use of rel="close" causes this button to close the dialog.
                            "<a rel='close' data-role='button' href='#'>Close</a>"
                });
            }
        }

    }
};


var myPzp = null;
function initializeWebinos(){
    // Wait for webinos to initialize
    webinos.session.addListener('registeredBrowser', function (data) {
        // If we haven't received this event before
        if (myPzp==null){
            myPzp = data.from;
            CoreApp.Webinos.Msg.init();
            CoreApp.Webinos.File.init();
        }
    });
    if(webinos.session.getSessionId()!=null){ //If the webinos has already started, force the registerBrowser event
        webinos.session.message_send({type: 'prop', payload: {status:'registerBrowser'}});
    }
};

function loadWebinosScript(){
    if(window.WebSocket || window.MozWebSocket)
    {
        $.getScript("/webinos.js", initializeWebinos);
    }
    else
    {
        if(typeof WebinosSocket == 'undefined')
        {
            setTimeout(loadWebinosScript, 500);
        }
        else
        {
            $.getScript("/webinos.js", initializeWebinos);
        }
    }
};
