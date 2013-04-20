Youtube = {
    isReady: false,
    init: function(){
        // Load the application key
        gapi.client.setApiKey('AIzaSyBR4PqDalc27HfAWupasbbEO_shMo0AFBA');
        // Load video search api
        gapi.client.load('youtube', 'v3', Youtube.loaded);
    },
    loaded: function(){
        Youtube.isReady = true;
    },
    searchYoutube: function(searchTerm, callback){
        var request = gapi.client.youtube.search.list({q: searchTerm,part: 'snippet' });
        request.execute(function(resp) {
            console.log(resp);
            if (callback!=null && typeof(callback)==='function')
                callback(resp);
        });
    }
}
