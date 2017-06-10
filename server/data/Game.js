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

var GameOptions = require('./GameOptions'),
	Player = require('./Player'),
	PlayerPlayedCardsTracker = require('./PlayerPlayedCardsTracker'),
	WhiteCard = require('./WhiteCard'),
	WhiteDeck = require('./WhiteDeck'),
	BlackDeck = require('./BlackDeck');

var GameState = {
	DEALING: 1,
	JUDGING: 2,
	LOBBY: 3,
	PLAYING: 4,
	ROUND_OVER: 5
};

var GamePlayerStates = {
	HOST: 1,
	IDLE: 2,
	JUDGE: 3,
	JUDGING: 4,
	PLAYING: 5,
	WINNER: 6
};

var Game = function(_id, _connectedUsers, _gameManager) {
	var game = this;
	var id = _id,
		connectedUsers = _connectedUsers,
		gameManager = _gameManager;
	
	var players = [],
		roundPlayers = [],
		playedCards = new PlayerPlayedCardsTracker(),
		host,
		blackDeck,
		blackCard,
		rawPossibleNextBlackCards = [],
		possibleNextBlackCards = [],
		whiteDeck,
		nextRoundBlind = false,
		state = GameState.LOBBY,
		options = new GameOptions(),
		judgeIndex = 0;

	var MINIMUM_BLACK_CARDS = 50,
		MINIMUM_WHITE_CARDS_PER_PLAYER = 20
		ROUND_INTERMISSION = 8*1000,
		PLAY_TIMEOUT_BASE = 45*1000,
		PLAY_TIMEOUT_PER_CARD = 15*1000,
		JUDGE_TIMEOUT_BASE = 40*1000,
		JUDGE_TIMEOUT_PER_CARD = 7*1000,
		MAX_SKIPS_BEFORE_KICK = 2;
	
	game.addPlayer = function(user) {
		if (options.playerLimit >= 3 && players.length >= options.playerLimit) {
			return;
		}

		user.joinGame(game);

		var player = new Player(user);
		players.push(player);

		if (host == null) {
			host = player
		}

		io.to(user.getSocketId()).emit("_receivePackage", { type: "joinedGame", data: { gameId: id }});
		Broadcaster.playerJoinedGame(players, [host.getUser().getUsername(), host.getUser().getSocketId(), game.getPlayerNames(), game.getInfo(true), game.getAllPlayerInfo()]);
		Broadcaster.chat(game.getPlayers(), "Server", player.getUser().getUsername() + " joined the game");
	}

	game.removePlayer = function(user) {
		var wasJudge = false;
		var player = game.getPlayerForUser(user);

		if (player) {
			console.log(String.format("[{0}] Removing {1} from game {2}.", process.uptime(), user.toString(), id));
			players.splice(players.indexOf(player),1);

			user.leaveGame(game);

			if (host == player) {
				if (players.length > 0) {
					host = players[0];
				} else {
					host = null;
				}
			}

			if (players.length == 0) {
				gameManager.destroyGame(id);
			} else {
				if (players.length < 3 && state != GameState.LOBBY) {
					console.log(String.format("[{0}] Resetting game {1} due to too few players after someone left.", process.uptime(), id));
					resetState(true);
				}
				Broadcaster.playerJoinedGame(players, [host.getUser().getUsername(), host.getUser().getSocketId(), game.getPlayerNames(), game.getInfo(true), game.getAllPlayerInfo()]);
				Broadcaster.chat(game.getPlayers(), "Server", player.getUser().getUsername() + " left the game");
				Broadcaster.updateGameList(server.getGameManager().getGames());
			}
		}
	}

	game.start = function() {
		if (state != GameState.LOBBY) {
			return;
		}

		var started = false;
		var numPlayers = players.length;

		if (numPlayers >= 0) {
			judgeIndex = parseInt(Math.random() * numPlayers);
			started = true;
		}

		if (started) {
			console.log(String.format("[{0}] Starting game {1}.", process.uptime(), id));
			blackDeck = game.loadBlackDeck();
			whiteDeck = game.loadWhiteDeck();

			blackCard = blackDeck.getNextCard();

			startNextRound();
			Broadcaster.updateGameList(server.getGameManager().getGames());
		}
	}

	game.getGameState = function() {
		return state;
	}

	game.getHost = function() {
		if (host == null) {
			return null;
		}

		return host.getUser();
	}

	game.getUsers = function() {
		return playersToUsers();
	}

	game.getId = function() {
		return id;
	}

	game.getPassword = function() {
		return options.password;
	}

	game.getPlayerForUser = function(user) {
		for (var i=0; i<players.length; i++) {
			if (players[i].getUser() == user) {
				return players[i];
			}
		}
		return null;
	}

	var playersToUsers = function() {
		var users = [];
		for (var i=0; i<players.length; i++) {
			users.push(players[i].getUser());
		}

		return users;
	}

	game.getPlayerNames = function() {
		var usernames = [];
		for (var i=0; i<players.length; i++) {
			usernames.push(players[i].getUser().getUsername());
		}

		return usernames;
	}

	game.getInfo = function(includePassword) {
		if (null == host) {
			return null;
		}
		var info = {
			id: id,
			host: host.getUser().getUsername(),
			state: state,
			gameOptions: options.serialize(includePassword),
			hasPassword: options.password != null && options.password != ""
		};

		var playerNames = [];
		for (var i=0; i<players.length; i++) {
			playerNames.push(players[i].getUser().getUsername());
		}
		info.players = playerNames;

		return info;
	}

	game.getAllPlayerInfo = function() {
		var info = [];
		for (var i=0; i<players.length; i++) {
			var playerInfo = game.getPlayerInfo(players[i]);
			info.push(playerInfo);
		}

		return info;
	}

	game.getPlayers = function() {
		return players;
	}

	game.getPlayerInfo = function(player) {
		if (player == null) {
			return {};
		}

		var playerInfo = {
			name: player.getUser().getUsername(),
			id: player.getUser().getSocketId(),
			score: player.getScore(),
			status: getPlayerStatus(player)
		};

		return playerInfo;
	}

	var getPlayerStatus = function(player) {
		var playerStatus;

		switch (state) {
			case GameState.LOBBY:
				if (host == player) {
					playerStatus = GamePlayerStates.HOST;
				} else {
					playerStatus = GamePlayerStates.IDLE;
				}
				break;
			case GameState.PLAYING:
				if (getJudge() == player) {
					playerStatus = GamePlayerStates.JUDGE;
				} else {
					if (roundPlayers.indexOf(player) < 0) {
						playerStatus = GamePlayerStates.IDLE;
						break;
					}

					var playerCards = playedCards.getCards(player);
					var pick = blackCard.getPick();
					if (playerCards != null && blackCard != null && playerCards.length == blackCard.getPick()) {
						playerStatus = GamePlayerStates.IDLE;
					} else {
						playerStatus = GamePlayerStates.PLAYING;
					}
				}
				break;
			case GameState.JUDGING:
				if (getJudge() == player) {
					playerStatus = GamePlayerStates.JUDGING;
				} else {
					playerStatus = GamePlayerStates.IDLE;
				}
				break;
			case GameState.ROUND_OVER:
				if (getJudge == player) {
					playerStatus = GamePlayerStates.JUDGE;
				}
				else if (player.getScore() >= options.scoreGoal) {
					playerStatus = GamePlayerStates.WINNER;
				} else {
					playerStatus = GamePlayerStates.IDLE;
				}
				break;
			default: break;
		}

		return playerStatus;
	}

	var getJudge = function() {
		if (judgeIndex >= 0 && judgeIndex < players.length) {
			return players[judgeIndex];
		} else {
			return null;
		}
	}

	game.loadBlackDeck = function() {
		return new BlackDeck();
	}

	game.loadWhiteDeck = function() {
		return new WhiteDeck(options.blanksInDeck);		
	}

	var startNextRound = function() {
		// TODO: Discard white cards

		judgeIndex++;
		if (judgeIndex >= players.length) {
			judgeIndex = 0;
		}
		roundPlayers = [];
		for (var i=0; i<players.length; i++) {
			if (players[i] != getJudge()) {
				roundPlayers.push(players[i]);
			}
		}

		dealState();
	}

	game.playCard = function(user, cardId, cardText) {
		var player = game.getPlayerForUser(user);

		if (player != null) {
			player.resetSkipCount();

			if (getJudge() == player || state != GameState.PLAYING) {
				return false;
			}

			var hand = player.getHand();
			var playCard = null;

			for (var i=0; i<hand.length; i++) {
				if (hand[i].getId() == cardId) {
					playCard = hand[i];
					if (playCard.getId() == "blank") {
						playCard.setId("blank-" + user.getUsername());
						playCard.setText(cardText);
					}
					hand.splice(i,1);
					break;
				}
			}

			if (playCard != null) {
				console.log(String.format("[{0}] {1} played card \"{2}\" (ID: {3})", process.uptime(), user.getUsername(), cardText, cardId));
				playedCards.addCard(player, playCard);
				Broadcaster.playerInfoChanged(game, players)

				if (startJudging()) {
					judgingState();
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	game.judgeCard = function(user, cardId) {
		var player = game.getPlayerForUser(user);
		if (getJudge() != player || state != GameState.JUDGING) {
			return false;
		}

		var cardPlayer = playedCards.getPlayerForId(cardId);
		if (cardPlayer == null) {
			return false;
		}
		cardPlayer.increaseScore();

		var clientCardId = playedCards.getCards(cardPlayer)[0].getId();

		rawPossibleNextBlackCards = getPossibleNextBlackCards();
		possibleNextBlackCards = [];
		for(var i = 0; i < rawPossibleNextBlackCards.length; i++) {
			var card = rawPossibleNextBlackCards[i];
			possibleNextBlackCards.push(card.getClientData());
		}

		Broadcaster.roundOver(game, players, cardPlayer, clientCardId, possibleNextBlackCards);

		// setTimeout(function() {
			if (cardPlayer.getScore() >= options.scoreGoal) {
				winState();
			}
		// }, ROUND_INTERMISSION);
	}

	game.setBlackCard = function(user, card) {
		var player = game.getPlayerForUser(user);
		if (getJudge() != player) {
			return false;
		}

		blackCard = card;

		startNextRound();
	}

	game.parseCommand = function(user, command) {
		if (user.isAdmin() || user === game.getHost()) {
			// if (command == "/shuffle") {
			// 	var allWhiteCards = [];
			// 	for (var i = 0; i < players.length; i++) {
			// 		allWhiteCards.push(players[i].getHand());
			// 	}
			// 	allWhiteCards = shuffle(allWhiteCards);
			// 	var cardsPerPlayer = allWhiteCards.length / players.length;
			// 	for (var i = 0; i < players.length; i++) {
			// 		sendCardsToPlayer(players[i], allWhiteCards.splice(0, cardsPerPlayer));
			// 	}

			// 	Broadcaster.chat(playersToUsers(), "server", "Hands reshuffled!");
			// }
			if (command == "/endless") {
				for (var i = 0; i < players.length; i++) {
					players[i].setScore(undefined);
				}
			} else if (command == "/blind") {
				nextRoundBlind = true;
				
				try {
					Broadcaster.chat(players, "Server", "The next round will be a blind-pick round.");
				} catch (e) {}
			}
		}
	}

	var startJudging = function() {
		if (state != GameState.PLAYING) {
			return false;
		}

		if (playedCards.size() == roundPlayers.length) {
			var startJudging = true;

			for (var i=0; i<playedCards.size(); i++) {
				if (playedCards.cards()[i].length != blackCard.getPick()) {
					startJudging = false;
					break;
				}
			}

			return startJudging;
		} else {
			return false;
		}
	}

	// Game States
	var dealState = function() {
		if (players.length < 0) {
			return;
		}

		state = GameState.DEALING;

		for (var i=0; i<players.length; i++) {
			var hand = players[i].getHand();

			if (hand.length == 0) {
				var card = new WhiteCard("name", players[i].getUser().getUsername(), false);
				hand.push(card);
			}

			while (hand.length < 10) {
				var card = getNextWhiteCard();
				hand.push(card);
			}

			sendCardsToPlayer(players[i], hand);
		}

		playingState();
	}

	var playingState = function() {
		state = GameState.PLAYING;

		playedCards.clear();
		
		if(blackCard.text) {
			blackCard = rawPossibleNextBlackCards.find((element) => element.getId() === blackCard.id);
			blackDeck.reshuffleUnusedCard(rawPossibleNextBlackCards.find((element) => element != blackCard));
		}

		if (blackCard != null) {
			blackDeck.discard(blackCard);
		}

		// blackCard = getNextBlackCard();

		Broadcaster.gameStateChanged(players, {
			blackCard: JSON.stringify(blackCard.getClientData()),
			blindRound: nextRoundBlind,
			gameState: state,
			judge: players[judgeIndex].getUser().getSocketId(),
			gameInfo: game.getInfo(true),
			playerInfo: game.getAllPlayerInfo()
		});

		nextRoundBlind = false;
	}

	var judgingState = function() {
		state = GameState.JUDGING;

		var whiteCardsToPlayers = getWhiteCards();
		Broadcaster.gameStateChanged(players, {
			blackCard: JSON.stringify(blackCard.getClientData()),
			gameState: state,
			judge: players[judgeIndex].getUser().getSocketId(),
			playerInfo: game.getAllPlayerInfo(),
			whiteCards: JSON.stringify(whiteCardsToPlayers),
		});

		//Broadcaster.playerInfoChanged(game, players)
	}

	var winState = function() {
		resetState(false);
	}

	var resetState = function(lostPlayer) {
		console.log(String.format("[{0}] Resetting game {1} to lobby (lostPlayer={2})", process.uptime(), id, lostPlayer));

		for (var player in players) {
			players[player].setHand([]);
			players[player].resetScore();
		}

		whiteDeck = null;
		blackDeck = null;
		blackCard = null;

		playedCards.clear();
		roundPlayers = [];

		state = GameState.LOBBY;
		var judge = getJudge();
		judgeIndex = 0;

		Broadcaster.gameStateChanged(players, {
			gameState: state
		});

		if (host != null || judge != null) {
			Broadcaster.playerInfoChanged(game, players);
		}

		Broadcaster.updateGameList(server.getGameManager().getGames());
	}

	var getNextBlackCard = function() {
		try {
			if (blackDeck && players.length >= 3) {
				return blackDeck.getNextCard();
			}
		} catch (e) {
			throw e;
		}
	}

	var getPossibleNextBlackCards = function() {
		try {
			if (blackDeck && players.length >= 3) {
				return blackDeck.getPossibleNextCards();
			}
		} catch (e) {
			throw e;
		}
	}

	var getNextWhiteCard = function() {
		try {
			if (whiteDeck && players.length >= 3) {
				return whiteDeck.getNextCard();
			}
		} catch (e) {
			throw e;
		}
	}

	var getWhiteCardData = function(cards) {
		var data = [];

		for (var i=0; i<cards.length; i++) {
			data.push(cards[i].getClientData());
		}

		return data;
	}
	
	var getWhiteCards = function() {
		if (state != GameState.JUDGING) {
			return [];
		} else {
			var shuffledPlayedCards = shuffle(playedCards.cards());
			var cardData = [];

			for (var i=0; i<shuffledPlayedCards.length; i++) {
				cardData.push(getWhiteCardData(shuffledPlayedCards[i]));
			}

			return cardData;
		}
	}

	var sendCardsToPlayer = function(player, cards) {
		io.to(player.getUser().getSocketId()).emit("_receivePackage", {
			type: "updateHand",
			data: {
				hand: JSON.stringify(getWhiteCardData(cards))
			}
		});
	}

	return game;
}

module.exports = Game;