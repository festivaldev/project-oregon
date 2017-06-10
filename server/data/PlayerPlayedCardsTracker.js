var PlayerPlayedCardsTracker = function() {
	var tracker = this;

	var playerCardMap = {};
	var reverseIdMap = {};

	tracker.addCard = function(player, card) {
		var cards = playerCardMap[player.getUser().getSocketId()];
		if (!cards) {
			cards = [];
			playerCardMap[player.getUser().getSocketId()] = cards;
		}

		reverseIdMap[card.getId()] = player;
		cards.push(card);
	}

	tracker.getPlayerForId = function(id) {
		return reverseIdMap[id];
	}

	tracker.hasPlayer = function(player) {
		return (playerCardMap[player.getUser().getSocketId()] != null);
	}

	tracker.getCards = function(player) {
		return playerCardMap[player.getUser().getSocketId()];
	}

	tracker.remove = function(player) {
		var cards = playerCardMap[player.getUser().getSocketId()];
		for (var card in cards) {
			delete reverseIdMap[cards[card].getId()];
		}
		delete playerCardMap[player.getUser().getSocketId()];

		return playerCardMap;
	}

	tracker.size = function() {
		return Object.keys(playerCardMap).length;
	}

	tracker.playedPlayers = function() {
		return Object.keys(playerCardMap);
	}

	tracker.clear = function() {
		playerCardMap = {};
		reverseIdMap = {};
	}

	tracker.cards = function() {
		// return Object.values(playerCardMap);
		return tracker.getMapValues(playerCardMap);
	}

	tracker.getMapValues = function(map) {
		return Object.keys(map).map(function(key) {
    		return map[key];
		});
	}

	return tracker;
}

module.exports = PlayerPlayedCardsTracker;