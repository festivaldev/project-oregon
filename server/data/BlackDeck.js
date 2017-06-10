var fs = require('fs');
var BlackCard = require('./BlackCard');

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

var BlackDeck = function() {
	var blackDeck = this;

	var deck = [];
	var discard = [];

	var init = function() {
		var calls = shuffle(JSON.parse(fs.readFileSync("cards.json", "utf8"))["calls"]);
		for (var i=0; i<calls.length; i++) {
			var card = new BlackCard(calls[i].id, calls[i].text, calls[i].text.length-1);
			deck.push(card);
		}
	}

	blackDeck.getDeck = function() {
		return deck;
	}

	blackDeck.getNextCard = function() {
		if (deck.length == 0) {
			return null;
		}

		var card = deck.splice(deck.length - 1, 1)[0];
		return card;
	}

	blackDeck.getPossibleNextCards = function() {
		if (deck.length == 0) {
			return null;
		}

		var cards = [];

		cards.push(blackDeck.getNextCard());
		cards.push(blackDeck.getNextCard());

		return cards;
	}

	blackDeck.reshuffleUnusedCard = function(card) {
		deck.push(card);
		deck = shuffle(deck);
	}

	blackDeck.discard = function(card) {
		if (card != null) {
			discard.push(card);
		}
	}

	blackDeck.reshuffle = function() {
		var cards = shuffle(discard);
		for (var i=0; i<cards.length; i++) {
			deck.push(cards.splice(i, 1));
		}

		discard = [];
	}

	blackDeck.totalCount = function() {
		return deck.length + discard.length;
	}

	init();
	return blackDeck;
}

module.exports = BlackDeck;