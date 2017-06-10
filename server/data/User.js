var User = function(_username, _socketId, _isAdmin) {
	var user = this;

	var username = _username,
		lastHeardFrom = 0,
		lastUserAction = 0,
		currentGame = null,
		socketId = _socketId,
		isAdmin = _isAdmin;

	var valid = true;

	user.isAdmin = function() {
		return isAdmin;
	}
	user.getUsername = function() {
		return username;
	}
	user.getSocketId = function() {
		return socketId;
	}
	user.toString = function() {
		return user.getUsername();
	}
	user.contactedServer = function() {
		lastHeardFrom = process.uptime();
	}
	user.getLastHeardFrom = function() {
		return lastHeardFrom;
	}
	user.userDidSomething = function() {
		lastUserAction = process.uptime();
	}
	user.getLastUserAction = function() {
		return lastHeardFrom;
	}
	user.isValid = function() {
		return valid;
	}
	user.noLongerValid = function() {
		if (currentGame != null) {
			currentGame.removePlayer(user);
		}

		valid = false;
	}
	user.getGame = function() {
		return currentGame;
	}
	user.joinGame = function(game) {
		if (currentGame != null) {
			return;
		}

		console.log(String.format("[{0}] {1} has joined game with ID {2}", process.uptime(), user.toString(), game.getId()));
		currentGame = game;
	}

	user.leaveGame = function(game) {
		if (currentGame == game) {
			currentGame = null;
		}
	}

	return user;
}

module.exports = User;