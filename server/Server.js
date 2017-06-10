var Server = function(_connectedUsers, _gameManager) {
	var server = this;
	var connectedUsers = _connectedUsers;
	var gameManager = _gameManager;

	this.getConnectedUsers = function() {
		return connectedUsers;
	}

	this.getGameManager = function() {
		return gameManager;
	}

	return server;
}

module.exports = Server;