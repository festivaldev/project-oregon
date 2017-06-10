var fs = require('fs');
var WhiteCard = require('./WhiteCard');

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

var WhiteDeck = function() {
	var whiteDeck = this;

	var deck = [];
	var discard = [];
	var lastBlankCardId = -1;

	var init = function() {
		var responses = shuffle(JSON.parse(fs.readFileSync("cards.json", "utf8"))["responses"]);

		// Demo Blank Cards

		for (var i = 0; i < 15; i++) {
			deck.push(new WhiteCard("blank", "(blank)", true));
		}

		for (var i = 0; i < responses.length; i++) {
			var card = new WhiteCard(responses[i].id, responses[i].text.join(""), false);
			deck.push(card);
		}

		// Demo Blank Cards

		for (var i = 0; i < 15; i++) {
			deck.push(new WhiteCard("blank", "(blank)", true));
		}

		deck = shuffle(deck);
	}

	whiteDeck.getNextCard = function() {
		if (deck.length == 0) {
			return null;
		}

		var card = deck.splice(deck.length-1, 1);
		return card[0];
	}

	whiteDeck.discard = function(card) {
		if (card != null) {
			discard.push(card);
		}
	}

	whiteDeck.reshuffle = function() {
		var cards = shuffle(discard);
		for (var i=0; i<cards.length; i++) {
			deck.push(cards.splice(i, 1));
		}

		discard = [];
	}

	whiteDeck.totalCount = function() {
		return deck.length + discard.length;
	}

	init();
	return whiteDeck;
}

module.exports = WhiteDeck;