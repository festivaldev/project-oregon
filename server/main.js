String.format = function(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	return format.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
};

function checkInternet(cb) {
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}

var express = require('express')(),
	webserver = require('http').createServer(express),
	io = require('socket.io').listen(webserver),
	readline = require('readline').createInterface(process.stdin, process.stdout),
	fs = require('fs'),
	request = require('request'),
	serverPort = 8080;

global.io = io;

webserver.listen(serverPort);
console.log(String.format("[{0}] Server listening on port {1}", process.uptime(), serverPort));

checkInternet(function(isConnected) {
	if (isConnected) {
		/*console.log(String.format("[{0}] Downloading current card set...", process.uptime()));
		request({
			url: "https://api.cardcastgame.com/v1/decks/GQUR6/cards",
			json: false
		}, function (error, response, body) {
    		if (!error && response.statusCode === 200) {
        		fs.writeFileSync("cards.json", body);
				console.log(String.format("[{0}] Finished ownloading current card set", process.uptime()));
    		}
		});*/
	}
})

var Server = require("./Server"),
	ConnectedUsers = require("./data/ConnectedUsers"),
	GameManager = require("./data/GameManager"),
	User = require("./data/User"),
	Broadcaster = require("./data/Broadcaster");

global.server = new Server(new ConnectedUsers(), new GameManager());
global.Broadcaster = Broadcaster;

io.sockets.on('connection', function(socket) {
	var isAdmin = false;
	var convertedIp = socket.request.connection.remoteAddress.replace(/:*(.*?):/g, "");
	if (convertedIp == "1" || convertedIp == "127.0.0.1") {
		isAdmin = true;
	}

	var user = new User(socket.handshake.query.username, socket.id, isAdmin);
	if (server.getConnectedUsers().checkAndAdd(user)) {
		io.to(socket.id).emit("_receivePackage", { type: "connection" });

		Broadcaster.updateGameList(server.getGameManager().getGames());
	}

	socket.on('disconnect', function() {
		var user = server.getConnectedUsers().getUser(socket.id);
		if (user) {
			server.getConnectedUsers().removeUser(user, "the user left the server");
		}
	});

	socket.on("_sendPackage", function(data) {
		var user = server.getConnectedUsers().getUser(socket.id);

		if (user) {
			switch (data.type) {
				case "createGame":
					server.getGameManager().createGameWithPlayer(user);
					break;
				case "joinGame":
					server.getGameManager().getGame(data.data.gameId).addPlayer(user);
					break;
				case "leaveGame":
					user.getGame().removePlayer(user);
					break;
				case "chat":
					var game = user.getGame();

					if (data.data.message.startsWith("/")) {
						game.parseCommand(user, data.data.message);
						return;
					}

					Broadcaster.chat(game.getPlayers(), user.getUsername(), data.data.message)
					break;
				case "startGame":
					user.getGame().start();
					break;
				case "playCard":
					var card = JSON.parse(data.data.card);
					user.getGame().playCard(user, card.id, card.text);
					break;
				case "judgeCard":
					var card = JSON.parse(data.data.card);
					user.getGame().judgeCard(user, card.id);
					break;
				case "setBlackCard":
					var card = JSON.parse(data.data.card);
					user.getGame().setBlackCard(user, card);
					break;
				default: break;
			}
		}
	})
});