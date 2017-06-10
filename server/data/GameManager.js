var Game = require('./Game'),
	ConnectedUsers = require('./ConnectedUsers');

var GameManager = function() {
	var gameManager = this;
	var games = {};

	var getMaxGames = function() {
		return 5;
	}

	var createGame = function() {
		if (Object.keys(games).length >= getMaxGames()) {
			return null;
		}

		var game = new Game(Math.floor(1000000 + Math.random() * 9000000).toString(), new ConnectedUsers(), gameManager);
		if (game.getId() < 0) {
			return null;
		}

		games[game.getId()] = game;
		return game;
	}
	gameManager.createGameWithPlayer = function(user) {
		var game = createGame();

		try {
			console.log(String.format("[{0}] User {1} created new game with ID {2}.", process.uptime(), user.toString(), game.getId()));
			game.addPlayer(user);
			Broadcaster.updateGameList(gameManager.getGames());
		} catch (error) {
			console.log(error);
		}
	};

	gameManager.destroyGame = function(gameId) {
        var game = games[gameId];
        if (!delete games[gameId]) {
            return;
        }

        var usersToRemove = game.getUsers();
        for (var i=0; i<usersToRemove.length; i++) {
            game.removePlayer(usersToRemove[i]);
        }

        //gameManager.broadcastGameListRefresh();
		Broadcaster.updateGameList(gameManager.getGames());
        console.log(String.format("[{0}] Destroyed game {1}.", process.uptime(), game.getId()));
    }

	gameManager.getGame = function(gameId) {
		return games[gameId];
	}

	gameManager.getGames = function() {
		return games;
	}

	return gameManager;
}

module.exports = GameManager;