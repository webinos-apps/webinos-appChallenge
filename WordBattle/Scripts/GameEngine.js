Game = {
    Settings:null, // This is a placeholder for size settings. Set during init()
    // The game objects
    Objects:{
        ButtonFlasher:{ // Recieves the elapsed event and flashes random number of letters
            init:function () {
                this.bind(Game.Events.ElapsedTime, this.timerTicked);
            },
            uninit:function () {
                this.unbind(Game.Events.ElapsedTime, this.timerTicked);
                this.destroy();
            },
            timerTicked:function () { // Flash the buttons every now and then
                var flashItems = Crafty.math.randomInt(1, 3);
                for (var i = 0; i < flashItems; i++)
                    Game.flashLetters();
            }
        },
        Timer:{ // A timer object that counts secs
            init:function () {
                this.bind("EnterFrame", this.framePassed);
            },
            uninit:function () {
                this.Enabled = false;
                this.unbind("EnterFrame", this.framePassed);
                this.destroy();
            },
            previousElapsed:null,
            framePassed:function () {
                // Ignore if not enabled
                if (!this.Enabled) return;
                var elapsed = Math.round((Date.now() - this.startTime) / 1000);
                if (elapsed != this.previousElapsed) {
                    this.previousElapsed = elapsed;
                    var reportTime;
                    var eventType;
                    if (this.CountingUp) {
                        reportTime = elapsed;
                        eventType = Game.Events.ElapsedTime;
                    }
                    else {
                        reportTime = this.numberOfSecs - elapsed;
                        eventType = Game.Events.RemainingTime;
                        // Disable timer is finished
                        if (reportTime <= 0) {
                            this.Enabled = false;
                            eventType = Game.Events.TimeUp;
                        }
                    }
                    var displayTime = Game.Utils.fixNumberTo2Digits(Math.floor(reportTime / 60)) + ":" + Game.Utils.fixNumberTo2Digits(reportTime % 60);
                    Crafty.trigger(eventType, displayTime);

                }
            },
            startTime:null, // Keep the starting point
            numberOfSecs:null, // Number of secs to count down
            CountingUp:true, // Indicate up or down counting
            startCounting:function () { // start counting up (Game.Events.ElapsedTime)
                this.previousElapsed = null;
                this.startTime = Date.now();
                this.CountingUp = true;
                this.Enabled = true;
            },
            startCountDown:function (numberOfSecs) { //start counting down (Game.Events.RemainingTime,Game.Events.TimeUp)
                this.numberOfSecs = numberOfSecs;
                this.previousElapsed = null;
                this.CountingUp = false;
                this.startTime = Date.now();
                this.Enabled = true;
            },
            Enabled:false
        },
        Letter:{
            stackIndex:0, //The index at which it is displayed in the stack
            wordIndex:0, //The index at which it is displayed in the word
            letter:'', //The letter it represents
            letterGraphic:null, // Placeholder to place a reference to the letter graphic
            AllowToggle:true, // Set false for intro letters
            SetLetter:function (newLetter) {
                this.letter = newLetter;
                this.letterGraphic.text(newLetter);
                this.drawTile();
                return this; // To enable chaining
            },
            IsUsed:false, //if it's used or not. The first time will be set to false
            toggleState:function () { // Toggle between used and not used
                if (!this.AllowToggle) return this;
                if (this.IsUsed) { // restore to stack
                    // Empty the slot
                    Game.Cache.CurrentWord[this.wordIndex] = null;
                    this.IsUsed = false;
                } else { // place in current word
                    // Update the location in the word
                    this.wordIndex = Game.getNextWordLetterIndex();
                    // Allocate that slot
                    Game.Cache.CurrentWord[this.wordIndex] = this;
                    this.IsUsed = true;
                }
                return this; // return self to enable chaining
            },
            drawTile:function () { // Updates the tiles location
                var placeholderLocation;
                var index;
                // Select on which shelf to place it on
                if (!this.IsUsed) { // place on the stack shelf
                    placeholderLocation = Game.Settings.StackLocation;
                    index = this.stackIndex;
                } else { // place in current word
                    placeholderLocation = Game.Settings.WordLocation;
                    index = this.wordIndex;
                }
                // update the x of both the tile and the letter graphic
                this.x = placeholderLocation.x + index * (Game.Settings.Sprites.Letter.w + Game.Settings.LetterSpacing);
                this.letterGraphic.x = this.x;
                // update the y of both the tile and the letter graphic (minus the height of the letter)
                this.y = placeholderLocation.y - Game.Settings.Sprites.Letter.h;
                this.letterGraphic.y = this.y;
                return this; // return self to enable chaining
            },
            clickHandler:function () {
                // Toggle state and redraw
                this.toggleState().drawTile();
            },
            init:function () { // This function is called as soon as the component is added to an entity.
                this.addComponent("2D, " + Game.Settings.RenderingTechnology + ", letterTile"); // Set the sprite to use
                this.addComponent("Mouse"); // Enable mouse/touch interaction
                this.bind("Click", this.clickHandler); // bind the click event
                // Set the size based on params
                this.width = Game.Settings.Sprites.Letter.w;
                this.height = Game.Settings.Sprites.Letter.h;
                // Set the letter graphic size
                this.letterGraphic = Crafty.e("DOM, Text").attr({w:Game.Settings.Sprites.Letter.w, h:Game.Settings.Sprites.Letter.h});
                this.letterGraphic.css({ "text-align":"center", "font-size":Game.Settings.LetterFontSize, "font-weight":"bold", "color":"#fff" });
                // Add flash animation
                this.addComponent("SpriteAnimation");
                this.animate("flash", [
                    [Game.Settings.Sprites.Letter.w + 1, 0, Game.Settings.Sprites.Letter.w, Game.Settings.Sprites.Letter.h],
                    [0, 0, Game.Settings.Sprites.Letter.w, Game.Settings.Sprites.Letter.h]
                ]);
            },
            flash:function () {
                this.animate("flash", 20);
            },
            uninit:function () { // destructor
                this.unbind("Click", this.clickHandler);
                this.letterGraphic.destroy();
                this.destroy();
            }
        },
        HeaderLabel:{
            init:function () { // A header label to display some text
                this.addComponent("DOM, Text");
                // Set size and style
                this.x = Game.Settings.HeaderArea.x;
                this.y = Game.Settings.HeaderArea.y;
                this.h = Game.Settings.HeaderArea.h;
                this.w = Game.Settings.HeaderArea.w;
                this.css({ "text-align":"center", "font-size":Game.Settings.HeaderFontSize, "font-weight":"bold", "color":"#fff" });
            },
            uninit:function () {
                this.destroy();
            }
        },
        ErrorLabel:{ // The error label shown when not connected shown in the main screen
            init:function () {
                this.addComponent("DOM, Text"); // Set the sprite to use
                this.attr({
                    w:Game.Settings.HeaderArea.w,
                    h:Game.Settings.HeaderArea.h,
                    x:Game.Settings.HeaderArea.x,
                    y:Game.Settings.ButtonLocations.HostGame.y });
                this.css({ "text-align":"center", "font-size":Game.Settings.HeaderFontSize, "font-weight":"bold", "color":"#fff" });
                this.text(Game.connectionErrorMessage);
            },
            uninit:function () {
                this.destroy();
            }
        },
        ScoreLabel:{
            init:function () {
                this.addComponent("DOM, Text");
                // bind to both the elapsed time and the score event
                this.bind(Game.Events.RemainingTime, this.updateTime);
                this.bind(Game.Events.TimeUp, this.updateTime);
                this.bind(Game.Events.WordFound, this.increaseScore);
                // Set size and style
                this.x = Game.Settings.HeaderArea.x;
                this.y = Game.Settings.HeaderArea.y;
                this.h = Game.Settings.HeaderArea.h;
                this.w = Game.Settings.HeaderArea.w;
                this.css({ "text-align":"center", "font-size":Game.Settings.HeaderFontSize, "font-weight":"bold", "color":"#fff" });
            },
            uninit:function () {
                this.unbind(Game.Events.ElapsedTime, this.updateTime);
                this.destroy();
            },
            timeElapsed:'00:00',
            updateTime:function (time) {
                this.timeElapsed = time;
                this.updateText();
            },
            updateText:function () {
                this.text("Score " + this.score + "/" + (Game.Cache.Contest.length + Game.Cache.FoundWords.length) + " - Time " + this.timeElapsed);
            },
            score:0,
            increaseScore:function () {
                this.score += 1;
                this.updateText();
            }
        },
        WaitingJoins:{ // A label to show connected peers
            init:function () {
                this.addComponent("DOM, Text");
                // bind to both the elapsed time and the webinos event
                this.bind(Game.Events.ElapsedTime, this.updateTime);
                this.bind(Game.Events.PlayerJoined, this.updatePlayers);
                // Set size and style
                this.x = Game.Settings.HeaderArea.x;
                this.y = Game.Settings.HeaderArea.y;
                this.h = Game.Settings.HeaderArea.h;
                this.w = Game.Settings.HeaderArea.w;
                this.css({ "text-align":"center", "font-size":Game.Settings.HeaderFontSize, "font-weight":"bold", "color":"#fff" });
            },
            uninit:function () {
                this.unbind(Game.Events.ElapsedTime, this.updateTime);
                this.unbind(Game.Events.PlayerJoined, this.updatePlayers);
                this.destroy();
            },
            timeElapsed:'00:00',
            playersJoined:0,
            updateTime:function (time) {
                this.timeElapsed = time;
                this.updateText();
            },
            updatePlayers:function () {
                this.playersJoined += 1;
                this.updateText();
            },
            updateText:function () {
                this.text("" + this.playersJoined + " joined during the last " + this.timeElapsed + " mins");
            }
        },
        WaitingHosts:{ // A label to show connected hosts
            init:function () {
                this.addComponent("DOM, Text");
                // bind to both the elapsed time and the webinos event
                this.bind(Game.Events.ElapsedTime, this.updateTime);
                this.bind(Game.Events.HostFound, this.updateHosts);
                // Set size and style
                this.x = Game.Settings.HeaderArea.x;
                this.y = Game.Settings.HeaderArea.y;
                this.h = Game.Settings.HeaderArea.h;
                this.w = Game.Settings.HeaderArea.w;
                this.css({ "text-align":"center", "font-size":Game.Settings.HeaderFontSize, "font-weight":"bold", "color":"#fff" });
            },
            uninit:function () {
                this.unbind(Game.Events.ElapsedTime, this.updateTime);
                this.unbind(Game.Events.PlayerJoined, this.updatePlayers);
                this.destroy();
            },
            timeElapsed:'00:00',
            hostsFound:0,
            updateTime:function (time) {
                this.timeElapsed = time;
                this.updateText();
            },
            updateHosts:function () {
                // Hosts are always unique
                this.hostsFound += 1;
                this.updateText();
            },
            updateText:function () {
                this.text("" + this.hostsFound + " host(s) found during the last " + this.timeElapsed + " mins");
            }
        },
        CommandButton:{
            textGraphic:null, // Placeholder for the text graphic
            init:function () { // This function is called as soon as the component is added to an entity.
                this.addComponent("2D, " + Game.Settings.RenderingTechnology + ", buttonBg"); // Set the sprite to use
                this.addComponent("Mouse"); // Enable mouse/touch interaction
                // Set the size based on params
                this.width = Game.Settings.ButtonsSize.w;
                this.height = Game.Settings.ButtonsSize.h;
                // Set the text
                this.textGraphic = Crafty.e("DOM, Text").attr({ w:this.width, h:this.height });
                this.textGraphic.css({ "text-align":"center", "font-size":Game.Settings.ButtonsFontSize, "font-weight":"bold", "color":"#fff" });
                // Add click animation
                this.addComponent("SpriteAnimation");
                //settings.LetterSize+1, 0, settings.ButtonsSize.w, settings.ButtonsSize.h
                this.animate("click", [
                    [Game.Settings.Sprites.Button.w + 1, 0],
                    [0, 0]
                ])
            },
            setProperties:function (text, location, cb) {
                // Set the location
                this.x = location.x;
                this.y = location.y;
                this.textGraphic.x = this.x;
                this.textGraphic.y = this.y + Game.Settings.ButtonsSize.textTopOffset;
                this.textGraphic.text(text);
                this.clickHandler = function () {
                    this.animate("click", 10, 0);
                    cb();
                };
                this.bind("Click", this.clickHandler); // bind the click event
                return this;// return self to enable chaining
            },
            setVisible:function (value) {
                this.visible = value;
                this.textGraphic.visible = value;
            },
            uninit:function () { // destructor
                this.unbind("Click", this.clickHandler);
                this.textGraphic.destroy();
                this.destroy();
            },
            clickHandler:null // Callback holder
        },
        Hosts:{ // Tiles that allow users to select the host to join
            host:{room:-1}, //The host it represents
            sphereGraphic:null, // The empty sphere that will show if selected or not
            selectedGraphic:null, // Placeholder to place a reference to the selection graphic
            textGraphic:null, // Placeholder to place a reference to the host description graphic
            toggleState:function () { // Toggle between selected and not selected
                if (Game.Cache.SelectedHost != null && Game.Cache.SelectedHost.room == this.host.room) { // deselect
                    // Empty the slot
                    Game.Cache.SelectedHost = null;
                    this.selectedGraphic.visible = false;
                } else { // place as active
                    Game.Cache.SelectedHost = this.host;
                    this.selectedGraphic.visible = true;
                }
                return this; // return self to enable chaining
            },
            clickHandler:function () {
                // Toggle state
                this.toggleState();
                //And notify of the change
                Crafty.trigger(Game.Events.SelectedHostChanged, null);
            },
            init:function () { // This function is called as soon as the component is added to an entity.
                this.addComponent("2D, " + Game.Settings.RenderingTechnology + ", hostsSprite"); // Set the sprite to use
                this.addComponent("Mouse"); // Enable mouse/touch interaction
                this.bind("Click", this.clickHandler); // bind the click event
                // Set the size based on params
                this.width = Game.Settings.Sprites.Hosts.w;
                this.height = Game.Settings.Sprites.Hosts.h;

                // update the x
                this.x = Game.Settings.WordLocation.x;
                // update the y (minus the height of the tile)
                this.y = Game.Settings.WordLocation.y - Game.Settings.Sprites.Hosts.h;

                this.sphereGraphic = Crafty.e("2D, " + Game.Settings.RenderingTechnology + ", sphereSprite").attr({w:Game.Settings.Sprites.HostSelection.w, h:Game.Settings.Sprites.HostSelection.h, x:this.x + Game.Settings.Sprites.HostSelection.x, y:this.y + Game.Settings.Sprites.HostSelection.y});
                // Set the letter graphic size
                this.selectedGraphic = Crafty.e("2D, " + Game.Settings.RenderingTechnology + ", hostSelectedSprite").attr({w:Game.Settings.Sprites.HostSelected.w, h:Game.Settings.Sprites.HostSelected.h, x:this.x + Game.Settings.Sprites.HostSelected.x, y:this.y + Game.Settings.Sprites.HostSelected.y });
                this.selectedGraphic.visible = false;

                this.textGraphic = Crafty.e("DOM, Text").attr({ w:this.width - Game.Settings.Sprites.HostSelection.w - 10, h:this.height, x:this.x + Game.Settings.Sprites.HostSelection.w, y:this.y + Game.Settings.Sprites.Hosts.marginTop });
                this.textGraphic.css({ "text-align":"center", "font-size":Game.Settings.Sprites.Hosts.fontSize, "font-weight":"bold", "color":"#fff" });

                // Add flash animation
                this.addComponent("SpriteAnimation");
                this.animate("flash", [
                    [Game.Settings.Sprites.Hosts.w + 1, 0, Game.Settings.Sprites.Hosts.w, Game.Settings.Sprites.Hosts.h],
                    [0, 0, Game.Settings.Sprites.Hosts.w, Game.Settings.Sprites.Hosts.h]
                ]);
            },
            setHost:function (hostData) {
                this.doSwitchAnimation(); //Do the effect even if not changed
                if (this.host != null && hostData.room == this.host.room) //if it's the same host
                    return; // do nothing
                this.host = hostData;
                if (Game.Cache.SelectedHost != null && Game.Cache.SelectedHost.room == this.host.room) { // if is active
                    this.selectedGraphic.visible = true;
                } else { // else not active
                    this.selectedGraphic.visible = false;
                }
                var display = hostData.host.pzp + '@' + hostData.host.pzh;
                // Cut off if it's too long
                if (display.length > Game.Settings.Sprites.Hosts.maxLength)
                    display = display.substring(0, Game.Settings.Sprites.Hosts.maxLength - 3) + "...";
                this.textGraphic.text(display)
            },
            doSwitchAnimation:function () {
                this.animate("flash", 20);
            },
            uninit:function () { // destructor
                this.unbind("Click", this.clickHandler);
                this.sphereGraphic.destroy();
                this.selectedGraphic.destroy();
                this.textGraphic.destroy();
                this.destroy();
            }
        },
        NextHost:{
            letterGraphic:null, // Placeholder to place a reference to the letter graphic
            clickHandler:function () {
                var nextIndex = -1;
                for (var i = 0; i < Game.Cache.HostsFound.length; i++) {
                    if (Game.Cache.HostsFound[i].room == Game.Cache.HostTile.host.room) {
                        nextIndex = i + 1;
                        break;
                    }
                }
                //If we are out of bounds select the first one
                if (nextIndex < 0 || nextIndex >= Game.Cache.HostsFound.length)
                    nextIndex = 0;

                // Switch to the next host
                Game.Cache.HostTile.setHost(Game.Cache.HostsFound[nextIndex]);
            },
            init:function () { // This function is called as soon as the component is added to an entity.
                this.addComponent("2D, " + Game.Settings.RenderingTechnology + ", letterTile"); // Set the sprite to use
                this.addComponent("Mouse"); // Enable mouse/touch interaction
                this.bind("Click", this.clickHandler); // bind the click event
                // Set the size based on params
                this.width = Game.Settings.Sprites.Letter.w;
                this.height = Game.Settings.Sprites.Letter.h;

                //Position it
                // update the x next to the host's tile
                this.x = Game.Settings.WordLocation.x + Game.Settings.Sprites.Hosts.w + Game.Settings.LetterSpacing;
                // update the y (minus the height of the tile)
                this.y = Game.Settings.WordLocation.y - Game.Settings.Sprites.Letter.h;

                // Set the letter graphic size
                this.letterGraphic = Crafty.e("DOM, Text").attr({w:Game.Settings.Sprites.Letter.w, h:Game.Settings.Sprites.Letter.h, x:this.x, y:this.y}).text(">");
                this.letterGraphic.css({ "text-align":"center", "font-size":Game.Settings.LetterFontSize, "font-weight":"bold", "color":"#fff" });
                // Add flash animation
                this.addComponent("SpriteAnimation");
                this.animate("flash", [
                    [Game.Settings.Sprites.Letter.w + 1, 0, Game.Settings.Sprites.Letter.w, Game.Settings.Sprites.Letter.h],
                    [0, 0, Game.Settings.Sprites.Letter.w, Game.Settings.Sprites.Letter.h]
                ]);
            },
            flash:function () {
                this.animate("flash", 20);
            },
            uninit:function () { // destructor
                this.unbind("Click", this.clickHandler);
                this.letterGraphic.destroy();
                this.destroy();
            }
        },
        PlayerScore:{
            playerIndex:0, //The player it refers too
            init:function () {
                this.addComponent("DOM, Text");
                // Set size and style
                this.css({ "text-align":"left", "font-size":Game.Settings.PlayersScore.fontSize, "font-weight":"bold", "color":"#fff" });
                this.h = Game.Settings.PlayersScore.h;
                this.w = Game.Settings.CanvasSize.w;
                this.x = 0;
            },
            setPlayerIndex:function (idx) {
                this.playerIndex = idx
                this.setText();
                if (Game.Cache.Players[this.playerIndex].hasLeft) this.gone();
                return this;//To chain commands
            },
            gone:function () {
                this.css({"text-decoration":"line-through"});
            },
            finished:function (score) {
                this.css({"color":"#339933;"});
                Game.Cache.Players[this.playerIndex].score = score;
                this.setText();
            },
            scored:function () {
                Game.Cache.Players[this.playerIndex].score += 1;
                this.setText();
            },
            setText:function () {
                var p = Game.Cache.Players[this.playerIndex];
                this.text(p.host.pzp + "@" + p.host.pzh + ": " + p.score);
            },
            uninit:function () {
                this.destroy();
            }
        },
        PlayersScore:{
            //Game.Events.PlayerLeft
            Players:{},
            init:function () {
                //Create a score label for each player
                for (var i = 0; i < Game.Cache.Players.length; i++) {
                    this.Players[Game.Cache.Players[i].playerId] = Crafty.e("playerScore").attr({y:Game.Settings.ButtonLocations.RemoveSpace.y + Game.Settings.ButtonsSize.h + Game.Settings.LetterSpacing + i * Game.Settings.PlayersScore.h }).setPlayerIndex(i);
                }
                //And bind to the events

                this.bind(Game.Events.PlayerLeft, this.playerLeft);
                this.bind(Game.Events.PlayerFinished, this.playerFinished);
                this.bind(Game.Events.PlayerScored, this.playerScored);
            },
            playerFinished:function (playerIdAndScore) {
                var userData = playerIdAndScore.split('|');
                if (userData.length == 2) {
                    this.Players[userData[0]].finished(userData[1]);
                }
            },
            playerLeft:function (playerId) {
                this.Players[playerId].gone();
            },
            playerScored:function (playerId) {
                this.Players[playerId].scored();
            },
            uninit:function () {
                this.unbind(Game.Events.PlayerLeft, this.playerLeft);
                this.unbind(Game.Events.PlayerFinished, this.playerFinished);
                this.unbind(Game.Events.PlayerScored, this.playerScored);
                //Destroy scores
                for (var key in this.Players)
                    this.Players[key].uninit();
                //and self
                this.destroy();
            }
        }
    },
    Cache:{ // Cache instances
        Background:null, // Holder for the background image
        GUIElements:[], // The in game buttons
        Letters:[], // The letters in the board
        Contest:[], // The contest data
        CurrentWord:[], // The letters is the current word
        FoundWords:[], // Found words
        Timer:null, // A timer instance
        CleanupMethods:[], // Various methods to call for cleanup
        HostsFound:[], //The hosts that were found (either joining or hosting)
        SelectedHost:null, // The selected host
        HostTile:null, //The host tile that selects the host
        JoinGameBtn:null, //The next host button
        Players:[] // The opponents in the game
    },
	isInitialized: false,
    //Initialize the game
    init:function (settings) {
		Game.isInitialized = true; //To avoid calling this again
        Game.Settings = settings;
        Crafty.init(settings.CanvasSize.w, settings.CanvasSize.h);//Initialize crafty
        Crafty.canvas.init();// and setup canvas

        // Try to connect to webinos
        Game.webinos.init();

        //Set the background
        Game.Cache.Background = Crafty.e("2D, " + Game.Settings.RenderingTechnology + ", Image")
            .attr({ w:settings.CanvasSize.w, h:settings.CanvasSize.h })
            .image(settings.BackgroundUrl);

        //Init the sprites
        Crafty.sprite(settings.Sprites.Letter.src, { letterTile:[0, 0, settings.Sprites.Letter.w, settings.Sprites.Letter.h] });
        Crafty.sprite(settings.Sprites.Button.src, { buttonBg:[0, 0, settings.Sprites.Button.w, settings.Sprites.Button.h ] });
        Crafty.sprite(settings.Sprites.Hosts.src, { hostsSprite:[0, 0, settings.Sprites.Hosts.w, settings.Sprites.Hosts.h ] });
        Crafty.sprite(settings.Sprites.HostSelected.src, { hostSelectedSprite:[0, 0, settings.Sprites.HostSelected.w, settings.Sprites.HostSelected.h ] });
        Crafty.sprite(settings.Sprites.HostSelection.src, { sphereSprite:[0, 0, settings.Sprites.HostSelection.w, settings.Sprites.HostSelection.h ] });


        //Define entities in crafty
        Crafty.c('singleLetter', Game.Objects.Letter);
        Crafty.c('timer', Game.Objects.Timer);
        Crafty.c('buttonFlasher', Game.Objects.ButtonFlasher);
        Crafty.c('cmdBtn', Game.Objects.CommandButton);
        Crafty.c('headerLabel', Game.Objects.HeaderLabel);
        Crafty.c('waitJoins', Game.Objects.WaitingJoins);
        Crafty.c('waitHosts', Game.Objects.WaitingHosts);
        Crafty.c('scoreHeader', Game.Objects.ScoreLabel);
        Crafty.c('errorLabel', Game.Objects.ErrorLabel);
        Crafty.c('hostsTile', Game.Objects.Hosts);
        Crafty.c('nextHostTile', Game.Objects.NextHost);
        Crafty.c('playerScore', Game.Objects.PlayerScore);
        Crafty.c('playersScore', Game.Objects.PlayersScore);

        // Create timer
        Game.Cache.Timer = Crafty.e("timer");

        // When a user joins the created game, display the play button
        Crafty.bind(Game.Events.PlayerJoined, Game.Screens.createStartGameButton);


        // Show main form
        Game.Screens.MainMenu();
    },
    allowMultiplayer:false,
    connectionErrorMessage:'Connecting to PZP...',
    noConnectivity:function () {
        Game.allowMultiplayer = false;
        //Fix ui
        switch (Game.Screens.currentScreen) {
            case Game.Screens.Available.Host:
            case Game.Screens.Available.Join:
            case Game.Screens.Available.Multiplayer:
            case Game.Screens.Available.Main:
                Game.Screens.MainMenu(); // Reload the main form which will show the error
                break;
        }
    },
    enableMultiplayer:function () {
        // If we already know about this, don't do anything
        if (Game.allowMultiplayer) return;
        // Otherwise set the variables
        Game.allowMultiplayer = true;
        Game.connectionErrorMessage = '';
        //And reload main to show the new buttons
        if (Game.Screens.currentScreen == Game.Screens.Available.Main) {
            Game.Screens.MainMenu();
        }
    },
    wordFound:function (indexOfWord) {
        var foundWord = Game.Cache.Contest[indexOfWord];
        // Remove word from list
        Game.Cache.Contest.splice(indexOfWord, 1);
        Game.Cache.FoundWords.push(foundWord);
        //notify others
        Game.webinos.IScored();

    },
    Screens:{
        Available:{
            Main:1,
            Single:2,
            Multiplayer:3,
            Host:4,
            Join:5,
            GameOver:6
        },
        currentScreen:null,
        MainMenu:function () {
            //Clear previous staff
            Game.Screens.clearBoard();
            //Clear previous players
            Game.Cache.Players = [];
            //Say goodbye
            Game.webinos.leaveRoom();
            Game.Cache.roomId = null; //And the roomId
            Game.Screens.currentScreen = Game.Screens.Available.Main;
            Game.Cache.GUIElements.push(Crafty.e("headerLabel")); // Add header for debug reasons
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("W"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("O"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("R"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:4 }).SetLetter("D"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:0 }).SetLetter("B"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:1 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:2 }).SetLetter("T"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:3 }).SetLetter("T"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:4 }).SetLetter("L"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:5 }).SetLetter("E"));

            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Single player", Game.Settings.ButtonLocations.SinglePlayer, Game.Screens.singlePlayer));

            if (Game.allowMultiplayer) {
                Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Host game", Game.Settings.ButtonLocations.HostGame, Game.Screens.hostGame));
                Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Join game", Game.Settings.ButtonLocations.JoinGame, Game.Screens.joinGame));
            } else {
                //show error message
                Game.Cache.GUIElements.push(Crafty.e("errorLabel"));
            }

            // Set the flasher 
            Game.Cache.GUIElements.push(Crafty.e("buttonFlasher"));
            // And start raising events
            Game.Cache.Timer.startCounting();

        },
        GameOver:function () {
            Crafty.unbind(Game.Events.TimeUp, Game.Screens.GameOver);

            //Get stats
            var found = Game.Cache.FoundWords.length;
            var total = Game.Cache.Contest.length + found;
            //Notify the rest
            Game.webinos.IFinished(found);

            //Clear previous staff
            Game.Screens.clearBoard();
            Game.Screens.currentScreen = Game.Screens.Available.GameOver;
            Game.Cache.GUIElements.push(Crafty.e("headerLabel").text("Found " + found + " out of " + total + " words!"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("G"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("M"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:4 }).SetLetter("E"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:1 }).SetLetter("O"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:2 }).SetLetter("V"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:3 }).SetLetter("E"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:4 }).SetLetter("R"));
            // Set the flasher
            Game.Cache.GUIElements.push(Crafty.e("buttonFlasher"));
            // And start raising events
            Game.Cache.Timer.startCounting();

            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Main menu", Game.Settings.ButtonLocations.CheckWord, Game.Screens.MainMenu));

            if (Game.webinos.roomId != null) Game.Cache.GUIElements.push(Crafty.e("playersScore"));
        },
        hostGame:function () {
            //Clear previous staff
            Game.Screens.clearBoard();
            Game.Screens.currentScreen = Game.Screens.Available.Host;
            Game.Cache.GUIElements.push(Crafty.e("waitJoins"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:0 }).SetLetter("W"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("I"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("T"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:5 }).SetLetter("4"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:0 }).SetLetter("R"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:1 }).SetLetter("I"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:2 }).SetLetter("V"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:3 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:4 }).SetLetter("L"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:5 }).SetLetter("S"));

            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Main menu", Game.Settings.ButtonLocations.MainMenu, Game.Screens.MainMenu));

            // Set the flasher
            Game.Cache.GUIElements.push(Crafty.e("buttonFlasher"));
            // Start raising events
            Game.Cache.Timer.startCounting();

            //And start broadcasting the room id
            Game.webinos.HostGame();
            // Which should stop if left this page
            Game.Cache.CleanupMethods.push(function () {
                Game.webinos.StopBroadcastRoomId();
            });

        },
        createStartGameButton:function () { // This buttons should be created only if at least 1 joins the game
            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Start game", Game.Settings.ButtonLocations.StartJoinGame, Game.Screens.hostMultiPlayer));
        },
        refreshAvailableHosts:function (hostData) { //The same as above only for the join counterpart
            if (Game.Cache.HostsFound.length == 1) {//If this is the first host found
                // Remove letters
                var numberOfLetters = Game.Cache.Letters.length;
                for (index = 0; index < numberOfLetters; index++) {
                    var letter = Game.Cache.Letters[0];
                    letter.uninit();
                    Game.Cache.Letters.splice(0, 1);
                }
                // Show select prompt
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:0 }).SetLetter("S"));
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("E"));
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("L"));
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("E"));
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:4 }).SetLetter("C"));
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:5 }).SetLetter("T"));
                Game.Cache.HostTile = Crafty.e("hostsTile");
                Game.Cache.HostTile.setHost(hostData);
            }
            if (Game.Cache.HostsFound.length == 2) { //If we have more than one hosts allow selection
                Game.Cache.GUIElements.push(Crafty.e("nextHostTile"));
            }
        },
        refreshJoinButton:function () {
            //If it doesn't exist yet
            if (Game.Cache.JoinGameBtn == null) {
                // Add join button
                Game.Cache.JoinGameBtn = Crafty.e("cmdBtn").setProperties("Join game", Game.Settings.ButtonLocations.StartJoinGame, Game.Screens.waitHost);
            }
            Game.Cache.JoinGameBtn.setVisible((Game.Cache.SelectedHost != null));
        },
        joinGame:function () {
            //Clear previous staff
            Game.Screens.clearBoard();
            Game.Screens.currentScreen = Game.Screens.Available.Join;
            //Clear any previous selected host
            Game.Cache.SelectedHost = null;
            //And players data
            Game.Cache.Players = [];
            //Add header
            Game.Cache.GUIElements.push(Crafty.e("waitHosts"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:0 }).SetLetter("W"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("I"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("T"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:5 }).SetLetter("4"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:1 }).SetLetter("H"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:2 }).SetLetter("O"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:3 }).SetLetter("S"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:4 }).SetLetter("T"));

            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Main menu", Game.Settings.ButtonLocations.MainMenu, Game.Screens.MainMenu));

            //Watch for change on the hosts
            Crafty.bind(Game.Events.HostFound, Game.Screens.refreshAvailableHosts);
            Game.Cache.CleanupMethods.push(function () {
                Crafty.unbind(Game.Events.HostFound, Game.Screens.refreshAvailableHosts);
            })

            //Watch for selected host to show the join button
            Crafty.bind(Game.Events.SelectedHostChanged, Game.Screens.refreshJoinButton);
            Game.Cache.CleanupMethods.push(function () {
                Crafty.unbind(Game.Events.SelectedHostChanged, Game.Screens.refreshJoinButton);
            })

            // Set the flasher 
            Game.Cache.GUIElements.push(Crafty.e("buttonFlasher"));
            // And start raising events
            Game.Cache.Timer.startCounting();
        },
        waitHost:function () {
            //Clear previous staff
            Game.Screens.clearBoard();
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:0 }).SetLetter("P"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:1 }).SetLetter("L"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:2 }).SetLetter("E"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:3 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:4 }).SetLetter("S"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, stackIndex:5 }).SetLetter("E"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:1 }).SetLetter("W"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:2 }).SetLetter("A"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:3 }).SetLetter("I"));
            Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ AllowToggle:false, IsUsed:true, wordIndex:4 }).SetLetter("T"));

            // Set the flasher
            Game.Cache.GUIElements.push(Crafty.e("buttonFlasher"));
            //Notify host
            Game.webinos.joinRoom(Game.Cache.SelectedHost.room);
            // And start raising events
            Game.Cache.Timer.startCounting();

            Crafty.bind(Game.Events.StartMultiPlayer, Game.Screens.joinMultiPlayer);
            Game.Cache.CleanupMethods.push(function () {
                Crafty.unbind(Game.Events.StartMultiPlayer, Game.Screens.joinMultiPlayer);
            })
        },
        joinMultiPlayer:function (contestId) {
            // Start playing
            Game.Screens.startGame(contestId, true);
        },
        hostMultiPlayer:function () {
            // Pick a random contest
            var currentContestIdx = Crafty.math.randomInt(0, ContestWords.length - 1);

            // Let others know about start of game
            Game.webinos.StartGame(currentContestIdx);

            // Start playing
            Game.Screens.startGame(currentContestIdx, true);

        },
        singlePlayer:function () {
            // Pick a random contest
            var currentContestIdx = Crafty.math.randomInt(0, ContestWords.length - 1);

            Game.Screens.startGame(currentContestIdx, false);
        },
        clearBoard:function () {
            // Clear timers
            if (Game.Cache.Timer != null) Game.Cache.Timer.Enabled = false;

            // Clear found words
            Game.Cache.FoundWords = [];
            // Clear the CurrentWord
            Game.Cache.CurrentWord = [];
            // Clear hosts
            Game.Cache.HostsFound = [];

            //Clear host tile
            if (Game.Cache.HostTile != null) {
                Game.Cache.HostTile.uninit();
                Game.Cache.HostTile = null;
            }
            //And the join button
            if (Game.Cache.JoinGameBtn != null) {
                Game.Cache.JoinGameBtn.uninit();
                Game.Cache.JoinGameBtn = null;
            }

            // Loop indexer
            var index;
            //Call cleanup functions
            var numberOfElements = Game.Cache.CleanupMethods.length;
            for (index = 0; index < numberOfElements; index++) {
                Game.Cache.CleanupMethods[0]();
                Game.Cache.CleanupMethods.splice(0, 1);
            }
            // Remove existing gui elements
            numberOfElements = Game.Cache.GUIElements.length;
            for (index = 0; index < numberOfElements; index++) {
                var element = Game.Cache.GUIElements[0];
                element.uninit();
                Game.Cache.GUIElements.splice(0, 1);
            }
            // Remove letters
            numberOfLetters = Game.Cache.Letters.length;
            for (index = 0; index < numberOfLetters; index++) {
                var letter = Game.Cache.Letters[0];
                letter.uninit();
                Game.Cache.Letters.splice(0, 1);
            }
            // unbind events
            Crafty.unbind(Game.Events.WordFound, Game.wordFound);
        },
        startGame:function (currentContestIdx, multiplayer) {
            //Clear previous staff
            Game.Screens.clearBoard();
            Game.Screens.currentScreen = (multiplayer ? Game.Screens.Available.Multiplayer : Game.Screens.Available.Single);
            //Wait the gameover signal
            Crafty.bind(Game.Events.TimeUp, Game.Screens.GameOver);
            // Create buttons
            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Remove spaces", Game.Settings.ButtonLocations.RemoveSpace, Game.removeSpacesFromWord));
            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Check word", Game.Settings.ButtonLocations.CheckWord, Game.checkWord));
            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Shuffle letters", Game.Settings.ButtonLocations.SuffleLetters, Game.shuffleLetters));
            Game.Cache.GUIElements.push(Crafty.e("cmdBtn").setProperties("Main menu", Game.Settings.ButtonLocations.BackToMenu, Game.Screens.MainMenu));

            // Get the selected contest data
            Game.Cache.Contest = ContestWords[currentContestIdx];
            // The last word is the longest one from which we will get the 
            // letters
            var word = Game.Cache.Contest[Game.Cache.Contest.length - 1];

            // We will create an array to flag the already picked letters
            var picked = [];
            // Initialize all letters to not picked
            for (var i = 0; i < word.length; i++) {
                picked.push(false);
                // We use the same loop to clear the CurrentWord too
                Game.Cache.CurrentWord.push(null);
            }
            // Start scrambling the word
            for (i = 0; i < word.length; i++) {
                var pickedLetterIndex;
                do { // pick a random letter that is not picked yet
                    pickedLetterIndex = Crafty.math.randomInt(0, word.length - 1);
                } while (picked[pickedLetterIndex] == true);
                // flag letter as picked            
                picked[pickedLetterIndex] = true;
                // create tile
                Game.Cache.Letters.push(Crafty.e("singleLetter").attr({ stackIndex:i }).SetLetter(word.charAt(pickedLetterIndex)));
            }
            // bind game events
            Crafty.bind(Game.Events.WordFound, Game.wordFound);
            // Create score header
            Game.Cache.GUIElements.push(Crafty.e("scoreHeader"));
            Game.Cache.Timer.startCountDown(Game.Settings.GameTime);

            if (multiplayer) {
                Game.Cache.GUIElements.push(Crafty.e("playersScore"));
            }

        }
    },
    flashLetters:function () {
        var pickedLetterIndex = Crafty.math.randomInt(0, Game.Cache.Letters.length - 1);
        Game.Cache.Letters[pickedLetterIndex].flash();
    },
    getNextWordLetterIndex:function () {
        // Check the current word for the first empty slots
        for (var i = 0; i < Game.Cache.CurrentWord.length; i++) {
            if (Game.Cache.CurrentWord[i] == null)
                return i;
        }
        // We didn't find an empty spot
        return -1;
    },
    removeSpacesFromWord:function () {// Removes any empy space from the current word
        for (var i = 0; i < Game.Cache.CurrentWord.length; i++) {
            // If we hit an empty slot and it's not the last tile
            if (Game.Cache.CurrentWord[i] == null && i < Game.Cache.CurrentWord.length - 1)
                for (var j = i + 1; j < Game.Cache.CurrentWord.length; j++) {
                    //Find the next placed tile and swap
                    if (Game.Cache.CurrentWord[j] != null) {
                        Game.Cache.CurrentWord[i] = Game.Cache.CurrentWord[j];
                        Game.Cache.CurrentWord[j] = null;
                        Game.Cache.CurrentWord[i].wordIndex = i;
                        Game.Cache.CurrentWord[i].drawTile();
                        break;
                    }
                }
        }
    },
    shuffleLetters:function () { // Mixes the letters in the stack
        // We will create an array to flag the already picked letters
        var picked = [];
        // Initialize all letters to not picked
        for (var i = 0; i < Game.Cache.Letters.length; i++)
            picked.push(false);
        for (i = 0; i < Game.Cache.Letters.length; i++) {
            var pickedLetterIndex;
            do { // pick a random letter that is not picked yet
                pickedLetterIndex = Crafty.math.randomInt(0, Game.Cache.Letters.length - 1);
            } while (picked[pickedLetterIndex] == true);
            // flag letter as picked            
            picked[pickedLetterIndex] = true;
            // update tile's index
            Game.Cache.Letters[pickedLetterIndex].stackIndex = i;
            // and redraw it if not placed in the word
            if (!Game.Cache.Letters[pickedLetterIndex].IsUsed)
                Game.Cache.Letters[pickedLetterIndex].drawTile();
        }
    },
    getCurrentWord:function () {
        var output = "";
        for (var i = 0; i < Game.Cache.CurrentWord.length; i++) {
            if (Game.Cache.CurrentWord[i] != null)
                output += Game.Cache.CurrentWord[i].letter;
        }
        return output;
    },
    checkWord:function () {
        var cWord = Game.getCurrentWord();
        if (cWord.length > 0)
            for (var i = 0; i < Game.Cache.Contest.length; i++)
                if (Game.Cache.Contest[i] == cWord)
                    Crafty.trigger(Game.Events.WordFound, i);
    },
    Events:{
        WordFound:"WordFound",
        ElapsedTime:"elapsedTime",
        RemainingTime:"remainingTime",
        TimeUp:"timeUp",
        PlayerJoined:"playerJoined",
        HostFound:"hostFound",
        SelectedHostChanged:"selectedHostChanged",
        StartMultiPlayer:"wordBattleIsOn",
        PlayerLeft:"playerChickened",
        PlayerFinished:"heFinished",
        PlayerScored:"heIsOnARoll"
    },
    Utils:{ // Various util functions
        _timers:{}, // Temp var to store various timers
        waitForFinalEvent:function (callback, ms, uniqueId) { // Wait until the last event is fired
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
            }
            if (Game.Utils._timers[uniqueId]) {
                clearTimeout(Game.Utils._timers[uniqueId]);
            }
            Game.Utils._timers[uniqueId] = setTimeout(callback, ms);
        },
        fixNumberTo2Digits:function (number) {
            if (number < 10)
                return "0" + number;
            else
                return number;
        },
        startsWith:function (text, prefix) { // string starts with
            return text.slice(0, prefix.length) == prefix;
        },
        endsWith:function (text, suffix) { // string ends with
            return text.slice(-suffix.length) == suffix;
        }
    },
    webinos:{
        MessageTypes:{
            AdvertiseRoom:"PleaseJoin", // Host advertises room id
            WillJoinRoom:"ChallengeAccepted", // Player accepts to join the game and waits for start
            ListOfPlayers:"PlayersList", //The list of players who will play
            GameStart:"StartGame", //Start the game using this contest
            GameOver:"GameOverForMe", // Each player notifies that has finished with the final score
            ScoredPoint:"pwnTheGame", // The player scored a word
            GoodBye:"iAmGone" // The player quit the game
        },
        myId:0,
        init:function () {
            //Register webinos Events
            Crafty.bind(myWebinos.Events.NoPZH,
                function () {
                    Game.connectionErrorMessage = "No PZH detected. Please join one in order to challenge your friends";
                    Game.noConnectivity();
                });
            Crafty.bind(myWebinos.Events.PZHDisconnected, function () {
                Game.connectionErrorMessage = "Could not connect to your PZH. Please check network status."
                Game.noConnectivity();
            });
            Crafty.bind(myWebinos.Events.EventsReady, Game.enableMultiplayer);
            // Start connector
            myWebinos.init();
            //Generate an ID to identify players (the case of two games on one pzp)
            Game.webinos.myId = Crafty.math.randomInt(100000, 999999);
        },
        roomId:null,
        parseMessage:function (from, type, message) { // Parses the incoming message
            type = type.split('|');// We have the roomId in the type
            switch (type[0]) {
                case Game.webinos.MessageTypes.AdvertiseRoom:
                    for (var i = 0; i < Game.Cache.HostsFound.length; i++) {
                        if (Game.Cache.HostsFound[i].room == message)// If we already have it
                            return; //do nothing
                    }
                    //Else add it and notify
                    Game.Cache.HostsFound.push({room:message, host:from});
                    Crafty.trigger(Game.Events.HostFound, Game.Cache.HostsFound[Game.Cache.HostsFound.length - 1]);
                    break;
                case Game.webinos.MessageTypes.WillJoinRoom:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If he will join our game
                        //Check if we already have him registered
                        for (var i = 0; Game.Cache.Players.length; i++)
                            if (Game.Cache.Players[i].playerId == message)//If we have the player
                                return; //Do nothing
                        //Else push the player in the list
                        Game.Cache.Players.push({ playerId:message, score:0, hasLeft:false, host:from});
                        Crafty.trigger(Game.Events.PlayerJoined, null);//Let the game know
                    }
                    break;
                case Game.webinos.MessageTypes.ListOfPlayers:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If it refers to our game room
                        Game.Cache.Players = message; //Store the players
                    }
                    break;
                case Game.webinos.MessageTypes.GameStart:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If it refers to our game room
                        Crafty.trigger(Game.Events.StartMultiPlayer, message);//Start at the given contest
                    }
                    break;
                case Game.webinos.MessageTypes.GoodBye:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If it refers to our game room
                        for (var i = 0; Game.Cache.Players.length; i++)
                            if (Game.Cache.Players[i].playerId == message) {//If we have the player
                                //Remove him and notify the GUI
                                Game.Cache.Players[i].hasLeft = true;
                                Crafty.trigger(Game.Events.PlayerLeft, Game.Cache.Players[i].playerId);
                                return;
                            }
                    }
                    break;
                case Game.webinos.MessageTypes.ScoredPoint:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If it refers to our game room
                        Crafty.trigger(Game.Events.PlayerScored, message);//User scored
                    }
                    break;
                case Game.webinos.MessageTypes.GameOver:
                    if (type.length == 2 && type[1] == Game.webinos.roomId) {//If it refers to our game room
                        Crafty.trigger(Game.Events.PlayerFinished, message);//User scored
                    }
                    break;


            }
        },
        IFinished:function (score) {
            if (Game.webinos.roomId == null) return;// Don't do anything if not in multiplayer
            var finalMessage = Game.webinos.myId + '|' + score;
            Crafty.trigger(Game.Events.PlayerFinished, finalMessage);
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.GameOver + "|" + Game.webinos.roomId, finalMessage);
        },
        IScored:function () {
            /* Don't do anything if not in multiplayer*/
            if (Game.webinos.roomId == null) return;
            //Update our gui
            Crafty.trigger(Game.Events.PlayerScored, Game.webinos.myId);
            //Notify the rest
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.ScoredPoint + '|' + Game.webinos.roomId, Game.webinos.myId);
        },
        leaveRoom:function () {
            /* Don't do anything if not in multiplayer*/
            if (Game.webinos.roomId == null) return;
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.GoodBye + '|' + Game.webinos.roomId, Game.webinos.myId);
        },
        joinRoom:function (room) {
            Game.webinos.roomId = room;
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.WillJoinRoom + '|' + Game.webinos.roomId, Game.webinos.myId);
        },
        HostGame:function () {
            // Generate a random room id to identify the session
            // We could use the pzp name but wanted to allow multiple
            // hosts on the same pzp to test the functionality
            Game.webinos.roomId = Crafty.math.randomInt(10000, 99999);
            //Broadcast as soon as possible
            Game.webinos.passedSecs = Game.Settings.webinos.BroadcastEvery;
            //Broadcast room id and wait for someone to listen.
            Crafty.bind(Game.Events.ElapsedTime, this.doBroadcast)
        },
        passedSecs:0, // Number of secs from previous broadcast
        doBroadcast:function () {
            // Broadcast every X secs the roomid
            if (Game.webinos.passedSecs >= Game.Settings.webinos.BroadcastEvery) {
                Game.webinos.passedSecs = 0; //Wait X for next broadcast
                // Send the event
                myWebinos.EventAPI.send(Game.webinos.MessageTypes.AdvertiseRoom, Game.webinos.roomId);
            } else {
                // Just wait for the proper time
                Game.webinos.passedSecs += 1;
            }
        },
        StopBroadcastRoomId:function () {// Stops advertising the roomId
            Crafty.unbind(Game.Events.ElapsedTime, this.doBroadcast)
        },
        StartGame:function (contestIndex) {
            //Broadcast users
            Game.Cache.Players.push({ playerId:Game.webinos.myId, score:0, hasLeft:false, host:myWebinos.EventAPI.myHost}); //Adding me too
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.ListOfPlayers + '|' + Game.webinos.roomId, Game.Cache.Players);
            //Start Game
            myWebinos.EventAPI.send(Game.webinos.MessageTypes.GameStart + '|' + Game.webinos.roomId, contestIndex);
        }
    },
    Resolution:{
        GenerateSettings:function () {// A function to modify the settings according to the device
            var GameInitSettings;
            //Android 2.x doesn't support scaling so we will simply add 0.5 scale
            // from the very beginning
            var ua = navigator.userAgent;
            if (ua.indexOf("Android") >= 0) {
                var androidversion = parseFloat(ua.slice(ua.indexOf("Android") + 8));
                if (androidversion < 4.0) {
                    GameInitSettings = Settings(0.5);
                    // We currently support only 0.5 scale as this is the one that works right now in android 2.x with webinos wrt
                    // Firefox and android 4.x are ok with the normal version.

                    //Apply some hacks for webinos android 2.x wrt
                    GameInitSettings.HeaderFontSize = "14px";
                    GameInitSettings.LetterFontSize = "28px";
                    GameInitSettings.ButtonsSize.textTopOffset = 6;
                }
            }
            if (GameInitSettings == null) GameInitSettings = Settings(1);
            return GameInitSettings;
        },
        windowSizeChanged:function () {
            Game.Utils.waitForFinalEvent(Game.Resolution.resizeGame, 500, "windowsSizeChanged");
        },
        resizeGame:function () {
            var gameArea = document.getElementById('cr-stage');
            //Debug for mobiles
            //Game.Cache.Header.text("w:" + window.innerWidth);

            // Get new width and height
            var newWidth = window.innerWidth;
            var newHeight = window.innerHeight;

            var newScale = 1; // Default scale

            if (!Game.Settings.isScaled) { //If the graphics are not scaled down (the webinos wrt case)
                //Do a Crafty scale
                //Reset scale
                Crafty.viewport.scale(0);

                newScale = Math.min(newWidth / Game.Settings.CanvasSize.w, newHeight / Game.Settings.CanvasSize.h);

                // If we need to zoomout
                if (newScale < 1) {
                    Crafty.viewport.scale(newScale);
                }
                else // reset for further processing
                    newScale = 1;
            }
            // Fix the left margin taking into account that there might be some scale there
            if (window.innerWidth > newScale * Game.Settings.CanvasSize.w)
                gameArea.style.left = Math.round((window.innerWidth - newScale * Game.Settings.CanvasSize.w) / 2) + "px";
            else
                gameArea.style.left = "0px";

            //When centering there is a crafty bug and need to reset the viewport
            // to enable the buttons
            setTimeout(function () {
                Crafty.viewport.reload();
            }, 500);
        }
    }
}

// When the document loads initialize the game
window.onload = function () {
	if (Game.isInitialized) return; // Avoid reloading the game if called again. See hack bellow for android
    // Generate setting trying to detect mobile webinos wrt
    var GameSettings = Game.Resolution.GenerateSettings();
    // Initialize game
    Game.init(GameSettings);
    //Fit current screen
    Game.Resolution.resizeGame();
    // And wait for resize events and orientation change
    window.addEventListener('resize', Game.Resolution.windowSizeChanged, false);
    window.addEventListener('orientationchange', Game.Resolution.windowSizeChanged, false);
};

// This is a hack for androids 2.x which seems to not call the onload
setTimeout(window.onload, 1000); 