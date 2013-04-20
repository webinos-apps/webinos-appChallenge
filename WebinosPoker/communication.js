communication = new webinosConnector('pokerGame');
console.log(communication.getState());

var tableID = -1, deviceID = -2, isItTheFirstGame = true, requestedID = false;
// Players array represents the empty spots, not the actual players.
var emptySeatsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8];
var playersArray = [];
var foldedPlayers = [];
var playersNamesArray = ["", "", "", "", "", "", "", "", ""];
var allPlayersMoney = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var playerHasThrownThatMuchOnTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var players = 0;
var graphics = new MyGraphics();
var game;

// If there is at least one table created then we ask for it 
function com_requestTables()
{
    tablesArray = [];
    communication.broadcast('Request Tables from the first host', {});
}

// Only the first host is responsible to send back all tables. (so as to reduce broadcast signals..)
communication.listen('Request Tables from the first host',
    function (data)
    {
        if (tablesArray.length > 0)
            if (tableID == tablesArray[0])
            {
                communication.broadcast('Give Tables', {allTables: tablesArray});
            }
    }
);

communication.listen('Give Tables',
    function (data)
    {
        tablesArray = data.data.allTables;
        gui_refreshTableListGUI();
    }
);

// If this device comes back to state pzh_online then resend all tebles.
communication.on('statusChange', function (state, old) {
    console.log('State changed: ' + old + ' --> ' + state);
    if (state == communication.STATE.PZH_ONLINE){
        com_requestTables();
    }
});

// Whenever someone enters a table he is given 
function com_requestTableInfo()
{
    communication.broadcast('Request Table Info', {table: tableID});
}

communication.listen('Request Table Info',
    function (data)
    {
        if ((deviceID == -1) && (tableID == data.data.table))
        {
            if (playing == 'yes')
                playing = 'waiting next round';
            communication.broadcast('Table Info', {table: tableID, playing: playing, fiveCards: fiveCards, pot: pot, playersNamesArray: playersNamesArray, playersArray: playersArray, foldedPlayers: foldedPlayers});
        }
    }
);

communication.listen('Table Info',
    function (data)
    {
        if ((tableID == data.data.table) && (deviceID == -2))
        {
            playing = data.data.playing;
            fiveCards = data.data.fiveCards;
            pot = data.data.pot;
            playersNamesArray = data.data.playersNamesArray;
            playersArray = data.data.playersArray;
            foldedPlayers = data.data.foldedPlayers;

            gui_showTwoCards();
        }
    }
);

// Return how many players are on the table!
function howManyPlayers()
{
    return playersArray.length + foldedPlayers.length;
}

// If there is a free spot return its place.
function checkIfThereIsFreeSpot()
{
    if (emptySeatsArray.length > 0)
        return true;
    return false;
}

// Whenever a new device is joining a game at a certain table it requests for a new id
function com_requestID(tableID, myName)
{
    requestedID = true;
    communication.broadcast('RequestID', {table: tableID, pName: myName, money: money});
}

communication.listen('RequestID',
    function (data)
    {
        if ((tableID == data.data.table) && (deviceID == -1))
        {
            if (checkIfThereIsFreeSpot())
            {
                var nonOccupiedSpot = emptySeatsArray.shift();
                foldedPlayers.push(nonOccupiedSpot);

                playersNamesArray[nonOccupiedSpot] = data.data.pName;
                allPlayersMoney[nonOccupiedSpot] = data.data.money;
                players = howManyPlayers();
                communication.broadcast('TakeID', {table: data.data.table, yourID: nonOccupiedSpot, howManyPlayers: players, playersNames: playersNamesArray, allPlayersMoney: allPlayersMoney, playersArray: playersArray, foldedPlayers: foldedPlayers});

                // If there are at least 3 persons on the table then commence. Else wait for 3 persons!
                if ((isItTheFirstGame) && (players > 1))
                {
                    isItTheFirstGame = false;
                    com_commenceGame();
                }
            }
            else
            {
                communication.broadcast('The table is full dear sir', {table: tableID});
            }
        }
    }
);

communication.listen('TakeID',
    function (data)
    {
        if (data.data.table == tableID)
        {
            players = data.data.howManyPlayers;
            playersNamesArray = data.data.playersNames;
            allPlayersMoney = data.data.allPlayersMoney;
            playersArray = data.data.playersArray;
            foldedPlayers = data.data.foldedPlayers;

            if (requestedID == true)
            {
                requestedID = false;
                deviceID = data.data.yourID;
                if ((isItTheFirstGame) && (players < 2))
                {
                    gui_waitForMorePlayers();
                }
                else
                    gui_waitingNextRound();
            }
            gui_refreshNamesListGUI();
        }
    }
);

communication.listen('The table is full dear sir',
    function (data)
    {
        if ((tableID == data.data.table) && (deviceID == -2))
            gui_fullTable();
    }
);

// Whenever a player stands up and leaves a table
function com_iStoodUp()
{
    communication.broadcast('Dear host & players, I just stood up!', {table: tableID, myID: deviceID});
    deviceID = -2;
}

communication.listen('Dear host & players, I just stood up!',
    function (data)
    {
        if (tableID == data.data.table)
        {
            var index = playersArray.indexOf(data.data.myID);
            if(index!=-1)
                playersArray.splice(index, 1);

            emptySeatsArray.push(data.data.myID);
            emptySeatsArray.sort();

            playersNamesArray[data.data.myID] = "";
            allPlayersMoney[data.data.myID] = 0;

            pot += playerHasThrownThatMuchOnTable[data.data.myID];
            playerHasThrownThatMuchOnTable[data.data.myID] = 0;

            if (deviceID == -1)
            {
                game.folded(data.data.myID);
                playing = 'no';
            }
        }
    }    
)

// Whenever a new table is created!
function com_letOthersKnowYouHostANewTable()
{
    // Give this host and table an id.
    tableID = tablesArray.length;
    deviceID = -1;
    game = new pok_init();
    // Broadcast this table to everyone
    communication.broadcast('New Table', {table: tableID});
}

communication.listen('New Table', 
    function (data)
    {
        tablesArray.push(data.data.table);
        gui_refreshTableListGUI();
    }
);

function com_commenceGame()
{
    if (playersArray.length + foldedPlayers.length > 1)
    {
        playing = 'yes';
        // Waiting has to be erased out of players' names.
        playersArray = playersArray.concat(foldedPlayers);
        playersArray.sort();
        foldedPlayers = [];

        game.play();
    }
    else
    {
        playing = 'waiting more players';
        communication.broadcast('Waiting for more Players!', {table: tableID});
    }
}

communication.listen('Waiting for more Players!',
    function (data)
    {
        if ((tableID == data.data.table) && (deviceID != -1))
            gui_waitForMorePlayers();
    })

function com_sendTwoCardsToEveryone(deck)
{
    //game.howManyBackCards = 5!
    for (var i=0; i<players; i++)
    {
        var myCards = game.howManyBackCards + i * 2;
        communication.broadcast('Your two cards', {table: tableID, device: i, card1: deck[myCards].getName(), card2: deck[myCards+1].getName()});
    }
}

communication.listen('Your two cards',
    function (data)
    {
        if (tableID == data.data.table)
        {
            // Waiting has to be erased out of players' names.
            playersArray = playersArray.concat(foldedPlayers);
            playersArray.sort();
            foldedPlayers = [];
            if (deviceID == data.data.device)
            {
                playing = 'yes';
                twoCards[0] = data.data.card1;
                twoCards[1] = data.data.card2;
            }

            gui_refreshNamesListGUI();
            fiveCards = ['cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg'];
            pot = 0;
        }
    }
);

function com_setPlayersBetGUI(act)
{
    communication.broadcast('All players bets & money', {table: tableID, device: deviceID, bet: playerHasThrownThatMuchOnTable, allPlayersMoney: allPlayersMoney, act: act})
}

communication.listen('All players bets & money',
    function (data)
    {
        if (tableID == data.data.table)
        {
            playerHasThrownThatMuchOnTable = data.data.bet;
            allPlayersMoney = data.data.allPlayersMoney;

            if (deviceID > -1)
                money = allPlayersMoney[deviceID];
            if ((deviceID == data.data.device) || ((-1 == data.data.device) && (deviceID != -2)))
                gui_refreshTwoCardsGUI();

            gui_refreshNamesListGUI();

            if (deviceID == -1)
            {
                if (data.data.act == 'check')
                    game.allChecked(data.data.device);
                else if (data.data.act == 'raise')
                    game.raised(data.data.device);
            }
        }
    }
);

function com_enableThisDevicesButtonsGUI(playerNo)
{
    communication.broadcast('Enable your buttons please sir', {table: tableID, device: playerNo, pot: pot});
}

communication.listen('Enable your buttons please sir',
    function (data)
    {
        if (tableID == data.data.table)
        {
            if (deviceID == data.data.device)
            {
                if (money == 0)
                    check();
                else
                {
                    buttonsEnabled = true;
                    gui_refreshTwoCardsGUI();
                }
            }

            for (var i=0; i<playersArray.length; i++)
                playersNamesArray[playersArray[i]] = playersNamesArray[playersArray[i]].replace("&rarr; ", "");
            playersNamesArray[data.data.device] = '&rarr; '.concat(playersNamesArray[data.data.device]);
            gui_refreshNamesListGUI();
        }
    }
);

function com_iFolded()
{
    communication.broadcast('I folded', {table: tableID, device: deviceID});
}

communication.listen('I folded',
    function (data)
    {
        if (tableID == data.data.table)
        {
            var index = playersArray.indexOf(data.data.device);
            if(index!=-1)
                playersArray.splice(index, 1);
            else
                console.log('Such player was not found! (fold)');

            foldedPlayers.push(data.data.device);

            if (deviceID == -1)
            {
                pot += playerHasThrownThatMuchOnTable[data.data.device];
                game.folded(data.data.device);
            }
        }
    }
);

function com_playersWon(which, what)
{
    for (var i=0; i<which.length; i++)
    {
        allPlayersMoney[which[i]] += (pot / which.length);
        allPlayersMoney[which[i]] += playerHasThrownThatMuchOnTable[which[i]];
    }

    playerHasThrownThatMuchOnTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    fiveCards = ['cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg', 'cards/Red_Back.svg'];
    if (what != 'folded')
        communication.broadcast('You won!', {table: tableID, pot: pot, allPlayersMoney: allPlayersMoney, who: which, why: 'Your hand was '+what[which[0]].getScore().score+'.'});
    else
        communication.broadcast('You won!', {table: tableID, pot: pot, allPlayersMoney: allPlayersMoney, who: which, why: 'Everyone else folded!'});
}

communication.listen('You won!',
    function (data)
    {
        if (tableID == data.data.table)
        {
            allPlayersMoney = data.data.allPlayersMoney;
            for (var i=0; i<playersNamesArray.length; i++)
                playersNamesArray[i] = playersNamesArray[i].replace("&rarr; ", "");
            for (var i=0; i<data.data.who.length; i++)
            {
                if (deviceID == data.data.who[i])
                {
                    var winnings = data.data.pot/data.data.who.length;
                    $( "#dialog-message" ).html('Congratulations '+playersNamesArray[deviceID]+', you have won this turn and '+winnings+' euros! '+data.data.why);
                    $( "#dialog-message" ).dialog({
                        modal: true,
                        width:'auto',
                        buttons: {
                            Ok: function() {
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                }
            }
        }
    }
);

function com_sendFiveCards(number, deck)
{
    if (number == 0)
        communication.broadcast('Your five cards', {table: tableID, pot: pot, card1: "cards/"+deck[0].getName()+".svg", card2: "cards/"+deck[1].getName()+".svg", card3: "cards/"+deck[2].getName()+".svg", card4: 'cards/Red_Back.svg', card5: 'cards/Red_Back.svg'});
    else if (number == 1)
        communication.broadcast('Your five cards', {table: tableID, pot: pot, card1: "cards/"+deck[0].getName()+".svg", card2: "cards/"+deck[1].getName()+".svg", card3: "cards/"+deck[2].getName()+".svg", card4: "cards/"+deck[3].getName()+".svg", card5: 'cards/Red_Back.svg'});
    else
        communication.broadcast('Your five cards', {table: tableID, pot: pot, card1: "cards/"+deck[0].getName()+".svg", card2: "cards/"+deck[1].getName()+".svg", card3: "cards/"+deck[2].getName()+".svg", card4: "cards/"+deck[3].getName()+".svg", card5: "cards/"+deck[4].getName()+".svg"});
}

communication.listen('Your five cards',
    function (data)
    {
        if (tableID == data.data.table)
        {
            pot = data.data.pot;
            fiveCards[0] = data.data.card1;
            fiveCards[1] = data.data.card2;
            fiveCards[2] = data.data.card3;
            fiveCards[3] = data.data.card4;
            fiveCards[4] = data.data.card5;
            gui_refreshFiveCardsGUI();
        }
    }
);

function com_iQuit()
{
    communication.broadcast('I Quit!', {table: tableID});
}

communication.listen('I Quit!',
    function (data)
    {
        var index = tablesArray.indexOf(data.data.table);
        if(index!=-1)
            tablesArray.splice(index, 1);
        else
            console.log('Such table was not found!');
        tablesArray.splice(index, 1);

        if ((tableID == data.data.table) || (tableID == -1))
            gui_initialization();
    }
);