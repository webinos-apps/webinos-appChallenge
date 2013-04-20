// To be called after the window has been loaded.
function pok_init()
{
  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Functions needed START.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */ 

  // Create One Single Card.
  function CreateSingleCard(rank, suit)
  {
    // ie: create card with rank:"7" and suit:"C" -> fullName = "7C", rank = "7", suit = "C".
    var fullName = rank.concat(suit);
    var rank = rank;
    var suit = suit;
    // Get Card's Full Name.
    this.getName = function() { return fullName; };
    // Get Card's Rank.
    this.getRank = function() { return rank; };
    // Get Card's Suit.
    this.getSuit = function() { return suit; };
  }

  // Create All Stack. Parameters are the amount of ranks, suits and how many times we want to shuffle the deck.
  function Cards(howManySuits, howManyRanks)
  {
    var _howManySuits = howManySuits;
    var _howManyRanks = howManyRanks;
    var allCards = new Array();
    // Populate all cards in order using ranks and suits arrays. Save in local variable allCards.
    this.populate = function()
                    {
                      /*allCards.push(new CreateSingleCard("8", "D"));
                      allCards.push(new CreateSingleCard("8", "C"));
                      allCards.push(new CreateSingleCard("6", "D"));
                      allCards.push(new CreateSingleCard("8", "H"));
                      allCards.push(new CreateSingleCard("6", "S"));
                      allCards.push(new CreateSingleCard("A", "H"));
                      allCards.push(new CreateSingleCard("A", "C"));
                      allCards.push(new CreateSingleCard("4", "C"));
                      allCards.push(new CreateSingleCard("5", "C"));*/
                      var singleOne;
                      for (i=0; i<_howManySuits; i++)
                        for(j=0; j<_howManyRanks; j++)
                        { 
                          singleOne = new CreateSingleCard(ranks[j], suits[i]);
                          allCards.push(singleOne);
                        }
                    };
    // Get the deck.
    this.getCards = function() { return allCards; };
    //Shuffle the deck n times.
    this.shuffle = function(n)
                  {
                    var howManyCards = _howManyRanks * _howManySuits;
                    var temp;
                    for (i = 0; i < n; i++)
                      for (j = 0; j < howManyCards; j++) {
                        k = Math.floor(Math.random() * 52);
                        temp = allCards[j];
                        allCards[j] = allCards[k];
                        allCards[k] = temp;
                      }
                  };
  }

  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Functions needed END.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */



  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Methods needed START.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

  // The poker game's logic
  this.play = function ()
  {
    whoDeals++;
    // If we reach the end then start over.
    if (whoDeals == players-1)
      whoDeals = 0;

    whoChecksFirst = whoDeals + 1;
    pot = 0;
    cardsShownOnTable = 0;

    // How many cards do we need from the deck?
    var cardsPlayed = howManyFrontCards * players + howManyBackCards;

    deck.shuffle(shuffleNTimes);

    // 5 Cards graphics.
    graphics.dealer(deck);

    // Send every player the whole deck from which each one takes his own two cards. (done this way to reduce traffic! first implementation was to send to everyone seperately but without encryption it's of no use.)
    com_sendTwoCardsToEveryone(deck.getCards());

    // Who is needed to check last so as to flip cards.
    // The player next to the one who deals throws in small Blind.
    // The player next of that one throws in big Blind.
    // If we reach the end then start over.
    // Decrease their amount of money by the money they throw in.
    var next, nextToNext;
    if (whoDeals < players - 2)
    {
      next = whoDeals+1;
      nextToNext = whoDeals+2;
    }
    else if (whoDeals < players - 1)
    {
      next = whoDeals+1;
      nextToNext = 0;
    }
    else
    {
      next = 0;
      nextToNext = 1;
    }

    whoIsNeededToCheckLast = nextToNext;
    playerHasThrownThatMuchOnTable[next] = smallBlind;
    playerHasThrownThatMuchOnTable[nextToNext] = bigBlind;
    allPlayersMoney[next] -= smallBlind;
    allPlayersMoney[nextToNext] -= bigBlind;
    
    com_setPlayersBetGUI(next);
    com_setPlayersBetGUI(nextToNext);
    // graphics.setInitialNums(next, nextToNext);


    if (whoDeals + 3 < players)
    {
      com_enableThisDevicesButtonsGUI(whoDeals+3);
    }
    else if (whoDeals + 2 < players)
    {
      com_enableThisDevicesButtonsGUI(0);
    }
    else if (whoDeals + 1 < players)
    {
      com_enableThisDevicesButtonsGUI(1);
    }
    else
    {
      com_enableThisDevicesButtonsGUI(2);
    }
  }

  this.allChecked = function(playerNo)
  {
    function EvaluateHand(player)
    {
      function DeconstructHand()
      {
        var handRank = new Array();
        var handSuit = new Array();

        this.deconstruct = function()
                          {
                            for (var i=0; i<5; i++)
                            {
                              handRank.push(deck.getCards()[i].getRank());
                              handSuit.push(deck.getCards()[i].getSuit());
                            }
                            handRank.push(deck.getCards()[5+player*2].getRank());
                            handSuit.push(deck.getCards()[5+player*2].getSuit());
                            handRank.push(deck.getCards()[6+player*2].getRank());
                            handSuit.push(deck.getCards()[6+player*2].getSuit());
                          }
        this.getHandRank = function() { return handRank; };
        this.getHandSuit = function() { return handSuit; };
        this.changeRanksToNumbers = function()
                                    {
                                      for (var i=0; i<7; i++)
                                      {
                                        switch (handRank[i])
                                        {
                                          case "J":
                                            handRank[i] = 11;
                                            break;
                                          case "Q":
                                            handRank[i] = 12;
                                            break;
                                          case "K":
                                            handRank[i] = 13;
                                            break;
                                          case "A":
                                            handRank[i] = 14;
                                            handRank[-1] = 1;
                                            handSuit[-1] = handSuit[i];
                                            break;
                                          default:
                                            handRank[i] = parseInt(handRank[i]);
                                        }
                                      }
                                    };
      }

      function SetScore(str, strNum, arg1, arg2)
      {
        return { 'score': str, 'scoreInNum': strNum, 'var1': arg1, 'var2': arg2};
      }

      // These 2 functions return a sorted array.
      function NumOrdA(a, b)
      {
        return (a-b);
      }

      function Order(array)
      {
        array.sort( NumOrdA );
      }

      // See if we have more than one cards that are same.
      function CountOccurences(suitOrRank)
      {
        var length = suitOrRank.length;
        var current;
        var howMany = new Array();
        var max = {count:0, times:0, values:[]};

        while(length--)
        {
          current = suitOrRank[length];
          howMany[current] = (howMany[current] || 0) + 1;
          if(howMany[current] > max.count)
          {
            max = {count:howMany[current], times:1, values: [current]};
          }
          else if(howMany[current] === max.count)
          {
            max.times++;
            max.values.push(current);
            Order(max.values);
          }
        }
        return max;
      }

      // Determine if player has FOK, FH, TOK, etc.
      function HowMany()
      {
        var howMany = CountOccurences(handRank);

        this.fourOfAKind = function()
                          {
                            if (howMany.count == 4)
                              return true;
                            return false;
                          };
        this.fullHouse = function()
                        {
                          if (howMany.count == 3)
                          {
                            if (howMany.times == 2)
                              return true;
                            else
                            {
                              function RemoveCards()
                              {
                                var temp = _handRank.indexOf(howMany.values[0]);;
                                while (temp != -1)
                                {
                                  _handRank.splice(temp, 1);
                                  temp = _handRank.indexOf(howMany.values[0]);
                                }
                              }

                              var _handRank = handRank;
                              RemoveCards();
                              var whatsLeft = CountOccurences(_handRank);
                              if (whatsLeft.count > 1)
                              {
                                howMany.values = whatsLeft.values.concat(howMany.values);
                                return true;
                              }
                              return false;
                            }
                          }
                          return false;
                        };
        this.threeOfAKind = function()
                            {
                              if (howMany.count == 3)
                                return true;
                              return false;
                            };
        this.twoPairs = function()
                        {
                          if ((howMany.count == 2) && (howMany.times > 1))
                            return true;
                          return false;
                        };
        this.onePair = function()
                      {
                        if (howMany.count == 2)
                          return true;
                        return false;
                      };

        if (this.fourOfAKind())
          this.setScore = function() { return SetScore("Four Of A Kind", 8, howMany.values.pop(), 0); };
        else if (this.fullHouse())
          this.setScore = function() { return SetScore("Full House", 7, howMany.values.pop(), howMany.values.pop()); };
        else if (this.threeOfAKind())
          this.setScore = function() { return SetScore("Three Of A Kind", 4, howMany.values.pop(), 0); };
        else if (this.twoPairs())
          this.setScore = function() { return SetScore("Two Pairs", 3, howMany.values.pop(), howMany.values.pop()); };
        else if (this.onePair())
          this.setScore = function() { return SetScore("One Pair", 2, howMany.values.pop(), 0); };
        else
          this.setScore = function() { return SetScore("High Card", 1, howMany.values.pop(), 0); };
      }

      // Player has Flush?
      function Flush()
      {
        var flush = CountOccurences(handSuit);

        this.isItFlush = function()
                        {
                          if (flush.count > 4)
                            return true;
                          return false;
                        };
        this.setScore = function() { return SetScore("Flush", 6, flush.values[0], 0); };
      }

      // Player has Straight?
      function Straight()
      {
        var _handRank = handRank;
        var max = 0;

        Order(_handRank);

        this.isThereStraight = function()
                              {
                                var straight = 1;
                                if (_handRank.length == 8)
                                  var start = 0, temp = _handRank[-1];
                                else
                                  var start = 1, temp = _handRank[0];
                                for (var i=start; i<7; i++)
                                {
                                  if (_handRank[i] == temp + 1)
                                  {
                                    straight++;
                                    temp++;
                                  }
                                  else if (straight > 4)
                                  {
                                    max = temp;
                                    return true;
                                  }
                                  else
                                  {
                                    straight = 1;
                                    temp = _handRank[i];
                                  }
                                }
                                return false;
                              };
        this.setScore = function() { return SetScore("Straight", 5, max, 0); };
      }

      // Player has Straight of same color?
      function StraightFlush()
      {
        var _flush = flush;
        var _straight = straight;

        this.isThereStraightFlush = function()
                                    {
                                      if ((_flush.isItFlush()) && (_straight.isThereStraight()))
                                        return true;
                                      return false;
                                    };
        this.setScore = function() { return SetScore("Straight Flush", 9, _flush.setScore().var1, _straight.setScore().var1); };
      }

      var hand = new DeconstructHand();
      hand.deconstruct();
      hand.changeRanksToNumbers();

      var handRank = hand.getHandRank();
      var handSuit = hand.getHandSuit();

      var score =
                {
                  score: "nothing",
                  scoreInNum: 0,
                  var1: 0,
                  var2: 0
                };

      var flush = new Flush();
      var straight = new Straight();
      var straightFlush = new StraightFlush();
      var howMany = new HowMany();

      if (straightFlush.isThereStraightFlush())
        score = straightFlush.setScore();
      else if ((howMany.fourOfAKind()) || (howMany.fullHouse()))
        score = howMany.setScore();
      else if (flush.isItFlush())
        score = flush.setScore();
      else if (straight.isThereStraight())
        score = straight.setScore();
      else
        score = howMany.setScore();

      this.getScore = function() { return score; };
      this.getHandRankInNum = function() { return handRank; };
      this.getHandRankInRanks = function() { return hand.getHandRank(); };
    }

    function winOrLose()
    {
      var hand = new Array();
      for (var i=0; i<playersArray.length; i++)
      {
        hand.push(new EvaluateHand(playersArray[i]));
      }

      var winners = new Array();
      var i = 10;
      while (winners.length == 0)
      {
        i--;
        for (var j=0; j<playersArray.length; j++)
        {
          if (hand[j].getScore().scoreInNum == i)
          {
            winners.push(j);
          }
        }
      }

      // If there are more than 1 potential winners.
      if (winners.length>1)
      {
        var firstVariable = hand[winners[0]].getScore().var1;
        var secondVariable = hand[winners[0]].getScore().var2;
        var j =  1;
        while (j<winners.length)
        {
          // If first determining card is higher or first is same and second is higher remove all previous "winners".
          if ((hand[winners[j]].getScore().var1 > firstVariable) || ((hand[winners[j]].getScore().var1 == firstVariable) && (hand[winners[j]].getScore().var2 > secondVariable)))
          {
            firstVariable = hand[winners[j]].getScore().var1;
            secondVariable = hand[winners[j]].getScore().var2;
            winners.splice(0, j);
            j = 0;
          }
          // Else if this player's hand is worse than the previous ones remove this "winner". j remains same as we removed this player.
          else if ((hand[winners[j]].getScore().var1 < firstVariable) || ((hand[winners[j]].getScore().var1 == firstVariable) && (hand[winners[j]].getScore().var2 < secondVariable)))
          {
            winners.splice(j, 1);
          }
          // Else this player has same hand so go to next one.
          else
          {
            j++;
          }
        }

        // Check all Cards amongst the winners. We need to have the same hand to award more than 1 winner. (this can happen only at High Card, One or Two Pairs.)
        if (i < 4)
        {
          var tempNum, tempWinner;
          var j=6;
          // j is needed for the array of the 5 best cards of one's hand. The array is sorted from smallest to bigest num.
          while ((j>1) && (winners.length>1))
          {
            tempNum = hand[winners[0]].getHandRankInNum()[j];
            var k=1;
            while (k<winners.length)
            {
              if (hand[winners[k]].getHandRankInNum()[j] > tempNum)
              {
                tempNum = hand[winners[k]].getHandRankInNum()[j];
                winners.splice(0, k);
              }
              else if (hand[winners[k]].getHandRankInNum()[j] < tempNum)
              {
                winners.splice(k, 1);
              }
              else
              {
                k++;
              }
            }
            j--;
          }
        }
      }

      com_playersWon(winners, hand);
    }


    // If this player is the one who is needed to check last then refresh pot and open back cards or see who won!
    if (playerNo == whoIsNeededToCheckLast)
    {
      pot = playerHasThrownThatMuchOnTable[playersArray[0]] * playersArray.length;
      graphics.setPot(pot);

      for (var i=0; i<playersArray.length; i++)
      {
        playerHasThrownThatMuchOnTable[playersArray[i]] = 0;
      }

      if (cardsShownOnTable == 0)
      {
        com_sendFiveCards(0, deck.getCards());
        for (var i=0; i<3; i++)
        {
          graphics.flipAndReplaceBackCard(i);
        }
      }
      else if (cardsShownOnTable == 1)
      {
        com_sendFiveCards(1, deck.getCards());
        graphics.flipAndReplaceBackCard(3);
      }
      else if (cardsShownOnTable == 2)
      {
        com_sendFiveCards(2, deck.getCards());
        graphics.flipAndReplaceBackCard(4);
      }
      else
      {
        winOrLose();
        setTimeout(function() 
                    {
                      com_commenceGame();
                    },
                    5000);
        return true;
      }
      cardsShownOnTable++;

      setTimeout(function() 
                  {
                    com_enableThisDevicesButtonsGUI(whoChecksFirst);
                  },
                  1000);
    }
    else
    {
      var next;
      var index = playersArray.indexOf(playerNo);
      if (index != -1)
        if (index != playersArray.length-1)
          next = index+1;
        else
          next = 0;
      else
        console.log('There is no such player over here! (check)');

      com_enableThisDevicesButtonsGUI(next);
    }
  }

  this.raised = function(playerNo)
  {
      var previous;
      var index = playersArray.indexOf(playerNo);
      if (index != -1)
        if (index != 0)
          previous = index-1;
        else
          previous = playersArray.length-1;
      else
        console.log('There is no such player over here! (raise - previous)');

      whoIsNeededToCheckLast = playersArray[previous];

      var next;
      var index = playersArray.indexOf(playerNo);
      if (index != -1)
        if (index != playersArray.length-1)
          next = index+1;
        else
          next = 0;
      else
        console.log('There is no such player over here! (raise - next)');

      com_enableThisDevicesButtonsGUI(next);
  }

  this.folded = function(playerNo)
  {
    // Ean eisai o teleutaios paiktis pou apemeine tote pairneis to pot!
    if (playersArray.length == 1)
    {
      com_playersWon([playersArray[0]], 'folded');
      setTimeout(function() 
                  {
                    com_commenceGame();
                  },
                  5000);
    }
    else
    {
      var next;
      var index = playersArray.indexOf(playerNo);
      if (index != -1)
        if (index != playersArray.length-1)
          next = index+1;
        else
          next = 0;
      else
        console.log('There is no such player over here! (folded)');

      com_enableThisDevicesButtonsGUI(next);
      
      // If the one that Folded is the one needed to check first then the next one takes this role.
      if (whoIsNeededToCheckLast == playerNo)
      {
        this.allChecked(playerNo);
      }
    }
  }


  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Methods needed END.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */



  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Initial Variables needed START.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

  // Set initial variables.
  var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");
  var suits = new Array("C", "D", "H", "S");
  var howManyRanks = ranks.length, howManySuits = suits.length;
  var howManyBackCards = 5;
  var howManyFrontCards = 2;
  var smallBlind = 5;
  var bigBlind = 10;
  var shuffleNTimes = 4;

  // Initially -1. After each game next player becomes the dealer.
  var whoDeals = -1;
  var cardsShownOnTable = 0;
  var whoChecksFirst = whoDeals + 1;
  var whoIsNeededToCheckLast = whoDeals + 2;

  this.whoIsNeededToCheckLast = whoIsNeededToCheckLast;
  this.howManyBackCards = howManyBackCards;

  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Initial Variables needed END.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */



  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Program START.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

  // Create the deck, populate and then shuffle it.
  var deck = new Cards(howManySuits, howManyRanks);
  deck.populate();
  deck.shuffle(shuffleNTimes);

  /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Main Program END.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
}