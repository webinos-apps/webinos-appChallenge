function MyGraphics()
{
  function NewCardImage()
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

  // Create a Back, a Back zTurning or a Front card.
  function CreateBackImage(i)
  {
    var backCard = new NewCardImage();
    backCard.setId('backCard'+i);
    backCard.setClass('backCards');
    backCard.setData(fiveCards[i]);
    backCard.setStyle(cardW);
    backCard.setWidth();
    backCard.appendTo($('#backCards')[0]);
  }

  //
  // Graphics For Check!!!
  //

  function setBet(playerID, bet)
  {
    betDivs[playerID].innerText = 'Bet: ' + bet;
  }

  // The whole deck
  var deck;

  this.dealer = function(deckCards)
  {
    deck = deckCards.getCards();

    $('#backCards').html('');
    $('#backCards').css("margin-bottom", -$(window).width()/(2*1.71405) - $(window).width()*0.1/(2*0.718421) + 150);
    for(i=0; i<game.howManyBackCards; i++)
    {
      CreateBackImage(i);
    }

    $('#pot').html('<div id="pot">Pot: '+pot+'</div');
  }

  // Flip and Show the Front of a Back Card.
  this.flipAndReplaceBackCard = function(i)
  {
    whichCardToFlip = $('#backCard'+i)[0];
    // Create a flipping Card.
    var flippingCard = new NewCardImage();
    flippingCard.setData('cards/Red_Back_Turn.svg');
    flippingCard.setClass('backCards');
    flippingCard.setStyle(cardW);
    flippingCard.setWidth();
    flippingCard.replaceWithThis(whichCardToFlip);

    // Replace with the flipped Card.
    var flippedCard = new NewCardImage();
    flippedCard.setData('cards/'+deck[i].getName()+'.svg');
    flippedCard.setClass('backCards');
    flippedCard.setId('flippedCard'+i);
    flippedCard.setStyle(cardW);
    flippedCard.setWidth();
    // Wait for 500 ms for the effect of the flipping card to end and then show the front of the card.
    setTimeout(function()
                {
                  flippedCard.replaceWithThis(flippingCard.getNewCardImage());
                },
                500);
  }

  this.createFrontImage = function(data)
  {
    var frontCard = new NewCardImage();
    frontCard.setData('cards/'+data+'.svg');
    frontCard.appendTo($('#two-cards')[0]);
  }

  //
  // Check Methods!!!
  //

  this.setBet = function(playerID, bet) { setBet(playerID, bet); };

  this.zeroPot = function() { $('#pot').html('POT: 0'); };

  this.zeroBet = function(playerID) { setBet(playerID, 0); };

  this.setPot = function(newPot) { $('#pot').text('Pot: '+newPot); };
}