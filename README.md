webinos-appChallenge
====================

webinos appChallenge winner applications, updated to run on the latest webinos platform.

To create the widgets, just run the ant command in the root. 10 wgt files should appear.

webinos requirements
====================

You will need to install the following APIs. Inside your webinos-pzp folder post the following commands:

* npm install git+https://github.com/webinos/webinos-api-events (ChatMachine,tiledimage,tiledmaps,WebinosPoker,webinos-beats,Whiteboard,WordBattle)
* npm install git+https://github.com/webinos/webinos-api-geolocation (CollabMaps)
* npm install git+https://github.com/webinos/webinos-api-app2app (CollabMaps, Spocked)
* npm install git+https://github.com/webinos/webinos-api-file (webinosProjector)

webinos-beats also uses test api to discover devices. It's already installed in the default webinos pzp.

Note that if you are on windows and use visual studio 2012 or later you must specify the --msvs_version=2012 switch.

