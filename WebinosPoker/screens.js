var tablesArray = new Array();
var whatsMyName = "";
var twoCards = ['cards/Red_Back.svg', 'cards/Red_Back.svg'];
var fiveCards = ['cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg'];
var buttonsEnabled = false;
// Possible playing states: no, yes, waiting more players, waiting next round, full table!
var playing = 'no';
var money = 1000;
var pot = 0;

// First Screen
function gui_initialization()
{
	$('body').html('<h1>POKER GAME</h1> <h2>SELECT YOUR TABLE</h2> <div id="tables"></div> <div id="buttons"> <button onclick="hostANewTable()">Host A New Table</button> <button onclick="gui_initialization()">Refresh</button> </div>');

	// Request all Hosted Tables.
	com_requestTables();
}

function gui_refreshTableListGUI()
{
	var tablesGUI = $('#tables');
	if (tablesGUI.length > 0)
	{
		tablesGUI.html('');
		for (var i=0; i<tablesArray.length; i++)
		{
			tablesGUI.append('<div id="table'+tablesArray[i]+'" class= "deviceDiv"> <button onclick="joinGame('+tablesArray[i]+')"> Table'+tablesArray[i]+' </button> </div>');
		}
	}
}

function gui_waitForMorePlayers()
{
	$('#two-cards').html('<p>Please wait for some more Players</p>');
	$('#pot').html('<p>Please wait for some more Players</p>');
}

function gui_refreshTwoCardsGUI()
{
	var twoCardsGUI = $('#two-cards');
	if (twoCardsGUI.length > 0)
	{
		// The width is cardW.
		twoCardsGUI.html('');
		graphics.createFrontImage(twoCards[0]);
		graphics.createFrontImage(twoCards[1]);

        var index = playersArray.indexOf(deviceID);
        if(index!=-1)
            if (index == 0)
            	var previousOne = playersArray[playersArray.length-1];
            else
            	var previousOne = playersArray[deviceID-1];
        else
            console.log('Such player was not found! (refreshBetMax)');
		var betMax = money - (playerHasThrownThatMuchOnTable[previousOne] - playerHasThrownThatMuchOnTable[deviceID]);

		var disabled = "disabled";
		if (buttonsEnabled)
			disabled = "";
		twoCardsGUI.append('<div class="buttons"> <div id="money">Money: '+allPlayersMoney[deviceID]+'</div> <div id="bet">Bet: '+playerHasThrownThatMuchOnTable[deviceID]+'</div> <button id="check" onclick="check()" '+disabled+'>Check</button> <button id="fold" onclick="fold()" '+disabled+'>Fold</button> <button id="All in" onclick="allin()" '+disabled+'>All In</button> <button id="Raise" onclick="raise()" '+disabled+'>Raise</button> <br /> <input type="range" min="0" max="'+betMax+'" value="0" step="5" id="slider" '+disabled+' /> <div id="range">Raise: 0</div> </div>');

		var goDown = $('#two-cards').height() + 4000;
		$('#buttons').css('margin-top', goDown+'px');

		// On change of slider update the range value!
	    $('#slider').change(
	    	function ()
	    	{
		    	var newValue = this.value;
		    	$('#range').html('Raise: '+newValue);
		    }
		);
	}
}

function gui_refreshMaxSliderGUI(thisMuch)
{
	$('#slider')[0].max = thisMuch;
}

function gui_refreshNamesListGUI()
{
	var playersGUI = $('#players-list');
	if (playersGUI.length > 0)
	{
		playersGUI.html('');
		var i = 0;
		while (i<playersArray.length)
		{
			playersGUI.append('<div class="player">'+playersNamesArray[playersArray[i]]+' bet: '+playerHasThrownThatMuchOnTable[playersArray[i]]+'</div>');
			i++;
		}
		i = 0;
		while (i<foldedPlayers.length)
		{
			playersGUI.append('<div class="folded">'+playersNamesArray[foldedPlayers[i]]+' bet: '+playerHasThrownThatMuchOnTable[foldedPlayers[i]]+'</div>');
			i++;
		}
	}
}

function gui_refreshFiveCardsGUI()
{
	if ( $('#five-cards-div').length>0 )
	{
		var fiveCardsGUI = $('#backCards');
		var potDiv = $('#pot');
		potDiv.html('POT: '+pot);
		fiveCardsGUI.html('');
		for (var i=0; i<5; i++)
		{
		    var backCard = new newCardImage();
		    backCard.setId('backCard'+i);
		    backCard.setClass('backCards');
		    backCard.setData(fiveCards[i]);
		    backCard.setWidth($(window).width()/5);
		    backCard.appendTo($('#backCards')[0]);
		}
	}
}

function refreshPotGUI()
{
	var potGUI = $('#pot');
	potGUI.html('POT: '+pot);
}

function joinGame(whichOne)
{
	tableID = whichOne;
	$('body').html('Loading... <br />');
	$('body').append('<button id="goBack" onclick="gui_initialization()">Go Back</button>');
	com_requestTableInfo();
}

function gui_showTwoCards()
{
	$('body').html('<div id="two-cards-div"> <div id="for-play"> <div id="dialog-message" title="Congratulations"> </div> <div id="two-cards" class="splitScreen"></div> <div id="players-list" class="splitScreen"></div> </div> <div id="buttons"> <button class="splitScreen" onclick="standUp()">Stand Up</button> <button class="splitScreen" onclick="showFiveCards()">Show Table</button> </div> </div>');
	if (playing == 'no')
		$('#two-cards').html('<input id="name" type="text" value="'+whatsMyName+'" placeholder="YOUR NAME" /> <button id="playButton" onclick="play()">Play</button>');
	else if (playing == 'waiting more players')
		gui_waitForMorePlayers();
	else if (playing == 'waiting next round')
		$('#two-cards').html('<input id="name" type="text" value="'+whatsMyName+'" placeholder="YOUR NAME" /> <button id="playButton" onclick="play()">Play</button> <p>Waiting for next Round</p>');
	else if (playing == 'full table')
		$('#two-cards').html('<input id="name" type="text" value="'+whatsMyName+'" placeholder="YOUR NAME" /> <button id="playButton" onclick="play()">Play</button> <p>We are Sorry. The table is full. Please wait for someone to leave or choose another table!</p>');
	else
		gui_refreshTwoCardsGUI();

	gui_refreshNamesListGUI();
}

function showFiveCards()
{
	$('body').html('<div id="five-cards-div"> <div id="for-play"> <div id="dialog-message" title="Congratulations"> </div> <div id="pot"> </div> <div id="backCards"> </div> </div> <div id="buttons"> <button class="splitScreen" onclick="gui_showTwoCards()">Show My Cards</button> <button class="splitScreen" onclick="standUp()">Stand Up</button> </div> </div>');
	if (playing == 'waiting more players')
		gui_waitForMorePlayers();
	else
	{
		gui_refreshFiveCardsGUI();
		refreshPotGUI();
	}

}

function standUp()
{
	com_iStoodUp();
	gui_initialization();
}

function gui_waitingNextRound()
{
	playing = 'waiting next round';
	$('#two-cards').html('<p>Waiting for next Round</p>');
}

function gui_fullTable()
{
	playing = 'full table';
	$('#two-cards').append('<p>We are Sorry. The table is full. Please wait for someone to leave or choose another table!</p>');
}

function play()
{
	var BLIDRegExpression = /^[a-zA-Z0-9]{3,20}$/; // {3, 20} adds the requirement that the string should be at least 3 and shorter than 20 characters long.
	whatsMyName = $('#name')[0].value;

	if (BLIDRegExpression.test(whatsMyName))
	{
		$('#playButton')[0].disabled = true;
		// Get Input
		com_requestID(tableID, whatsMyName);
	}
	else
	{
		$('#two-cards').html('<p>Please provide us with a name longer than 3 and shorter than 20 characters!</p> <input id="name" type="text" value="" maxlength="100" placeholder="YOUR NAME" /> <button id="playButton" onclick="play()">Play</button>');
	}
}


// Replaced by the Table screen
function replaceWithTable()
{
	$('body').html('<div id="tableDiv"> <div id="table"> </div> <div id="backCards"> </div> <div id="players"> </div> <div id="pot"> </div> </div> <div id="buttons"> <button  onclick="quitHosting()">Exit</button> </div>');
	$('#backCards').css("top", -$(window).width()/(2*1.71405) - $(window).width()*0.1/(2*0.718421));
	// Draw Table
	var table = document.createElement('object');
	table.setAttribute('type', 'image/svg+xml');
	table.setAttribute('width', '100%');
	table.setAttribute('data', 'PokerTable.svg');
	$('#table').html(table);
}

$(window).resize(function() {
	$('#backCards').css("top", - $(window).width()/(2*1.71405) - $(window).width()*0.1/(2*0.718421));
	if ($('#backCards').html() != ' ')
		$('#backCards').css("margin-bottom", (-$(window).width()/(2*1.71405) - $(window).width()*0.1/(2*0.718421))/2.5);
});

function hostANewTable()
{
	com_letOthersKnowYouHostANewTable();

	replaceWithTable();
}


// Once Check Button is pressed some or one cards are flipped and the game goes on.
this.check = function()
{
	buttonsEnabled = false;

	var betBefore = playerHasThrownThatMuchOnTable[deviceID];

	if (deviceID == playersArray[0])
	{
		playerHasThrownThatMuchOnTable[deviceID] = playerHasThrownThatMuchOnTable[playersArray[playersArray.length-1]];
	}
	else
	{
		playerHasThrownThatMuchOnTable[deviceID] = playerHasThrownThatMuchOnTable[playersArray[deviceID-1]];
	}

	var differenceBetweenBets = playerHasThrownThatMuchOnTable[deviceID] - betBefore;

	allPlayersMoney[deviceID] -= differenceBetweenBets;

	com_setPlayersBetGUI('check');
}

this.raise = function()
{
	howMuch = parseInt($('#slider')[0].value);
	if (howMuch == 0)
	  this.check();
	else
	{
	  buttonsEnabled = false;
	  var previousPlayerHasBetThisMuch; 
	  if (deviceID == playersArray[0])
	  {
	    previousPlayerHasBetThisMuch = playerHasThrownThatMuchOnTable[playersArray[playersArray.length-1]];
	  }
	  else
	  {
	    previousPlayerHasBetThisMuch = playerHasThrownThatMuchOnTable[playersArray[deviceID-1]];
	  }

	  var hasBetBefore = playerHasThrownThatMuchOnTable[deviceID];
	  var betDifference;
	  playerHasThrownThatMuchOnTable[deviceID] = howMuch + previousPlayerHasBetThisMuch;

	  betDifference = previousPlayerHasBetThisMuch - hasBetBefore;
	  allPlayersMoney[deviceID] -= (howMuch + betDifference);

	  com_setPlayersBetGUI('raise');
	}
}

this.allin = function()
{
	$('#slider')[0].value = $('#slider')[0].max;
	this.raise();
}

this.fold = function()
{
	buttonsEnabled = false;
	com_iFolded();
}


gui_initialization();

function quitHosting()
{
	com_iQuit();
	gui_initialization();
}

function newCardImage()
{
	function SetType()
	{
	  newCard.setAttribute('type', 'image/svg+xml');
	}

	function SetWidth()
	{
	  newCard.setAttribute('width', cardW);
	}

	var newCard = document.createElement('object');
	SetType();
	SetWidth();

	this.setWidth = function() { newCard.setAttribute('width', '10%'); };
	this.setStyle = function(newStyle) { newCard.setAttribute('top', -newStyle); };
	this.setClass = function(className) { newCard.setAttribute('class', className); };
	this.setId = function(id) { newCard.setAttribute('id', id); };
	this.getNewCardImage = function() { return newCard; };
	this.setData = function(data) { newCard.setAttribute('data', data); };
	this.appendTo = function(appendWhere) { appendWhere.appendChild(newCard); };
	this.replaceWithThis = function(replaceWhat) { replaceWhat.parentNode.replaceChild(newCard, replaceWhat);}
}