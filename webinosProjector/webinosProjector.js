webinosvideo = {
	EmptyList: [ { 0: {src:'old-projector.gif', type: 'image/jpeg'}, config: { duration: 2, title: "Please select a file via the controller app" }}], // The static image will show while not playing video
    HasFiles: false
};

function GetVideoIndex(){
    var addToIndex = null;
    if (!webinosvideo.HasFiles) {
        webinosvideo.HasFiles = true;
        return 0; // Replace file if this is the first one
    }else{
        return projekktor('videoplayer').getPlaylist().length + 1;
    }
}

$(document).ready(function() {
        loadWebinosScript();
	    projekktor(
                '#videoplayer', // destination-container-selector-fuzz a la jQuery
                {
					controls: true,
					volume: 0.5,
					loop: true,
					autoplay: true
				}, 
                function(player) { // "onready" callback -
					//Load the empty list
					projekktor('videoplayer').setFile(webinosvideo.EmptyList);
                    projekktor('videoplayer').setFullscreen(true);
                }
	    );
        CoreApp.Webinos.Msg.messageHandler = function(from, type, msg){
            switch(type){
                case "add-youtube":
                    projekktor('videoplayer').setItem({
                        0: {src: msg.link, type: 'video/youtube' },
                        config: {
                            poster: msg.poster,
                            title: msg.title
                        }
                    }, GetVideoIndex(), true);
                    break;
                case "add-image":
                    projekktor('videoplayer').setItem({
                        0: {src: msg.link, type: 'image/jpeg'},
                        config: {
                            duration: msg.duration,
                            title: msg.title
                        }
                    }, GetVideoIndex(), true);
                    break;
                case "clear-video":
                    // TODO: we could clear video chunks here
                    break;
                case "add-video":
                    localStorage[msg.title + msg.chunkId] = msg.link;
                    break;
                case "add-video-finish":
                    // We could save the file but then we wouldn't be able to access it

                    // Reconstruct the video from chunks
                    var link = "";
                    for (var i = 0; i< msg.chunks; i++){
                        link += localStorage[msg.title + i];
                    }
                    projekktor('videoplayer').setItem({
                        0: {src: link, type: 'video/' + msg.title.split('.').pop()},
                        config: {
                            title: msg.title
                        }
                    }, GetVideoIndex(), true);
                    break;
            }
        };
});
