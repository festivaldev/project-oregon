var Broadcaster = {
	chat: function(usersInGame, username, message) {
		var date = new Date();
		var hours = date.getHours() >= 10 ? date.getHours() : "0" + date.getHours();
		var minutes = date.getMinutes() >= 10 ? date.getMinutes() : "0" + date.getMinutes();
		var seconds = date.getSeconds() >= 10 ? date.getSeconds() : "0" + date.getSeconds();

		for (var i=0; i<usersInGame.length; i++) {
			var user = usersInGame[i];
			io.to(usersInGame[i].getUser().getSocketId()).emit("_receivePackage", {
				type: "chat",
				data: {
					time: String.format("{0}:{1}:{2}", hours, minutes, seconds),
					user: username,
					message: message
				}
			});
		}
	},
	userJoined: function(userList) {
		io.sockets.emit("_receivePackage", {
			type: "userJoined",
			data: {
				usernames: userList
			}
		})
	},
	userLeft: function(userList) {
		io.sockets.emit("_receivePackage", {
			type: "userLeft",
			data: {
				usernames: userList
			}
		})
	},
	playerJoinedGame: function(usersInGame, gameInfo) {
		for (var i=0; i<usersInGame.length; i++) {
			io.to(usersInGame[i].getUser().getSocketId()).emit("_receivePackage", {
				type: "playerJoinedGame",
				data: {
					host: {
						name: gameInfo[0],
						socketId: gameInfo[1]
					},
					usernames: gameInfo[2],
					gameInfo: gameInfo[3],
					playerInfo: gameInfo[4]
				}
			})
		}
	},
	playerInfoChanged: function(game, usersInGame) {
		for (var i=0; i<usersInGame.length; i++) {
			io.to(usersInGame[i].getUser().getSocketId()).emit("_receivePackage", {
				type: "playerInfoChanged",
				data: { playerInfo: game.getAllPlayerInfo() }
			});
		}
	},
	updateGameList: function(games) {
		var gameList = [];

		for (var game in games) {
			gameList.push({
				id: games[game].getId(),
				host: games[game].getHost().getUsername(),
				hostId: games[game].getHost().getSocketId(),
				state: games[game].getGameState(),
				playerCount: games[game].getPlayerNames().length,
				options: games[game].getInfo(false)
			});
		}

		io.sockets.emit("_receivePackage", {
			type: "updateGameList",
			data: {
				gameList: gameList
			}
		})
	},
	roundOver: function(game, usersInGame, cardPlayer, clientCardId, possibleBlackCards) {
		for (var i=0; i<usersInGame.length; i++) {

			if (clientCardId === "blank") {
				clientCardId += "-" + cardPlayer.getUser().getUsername();
			}

			io.to(usersInGame[i].getUser().getSocketId()).emit("_receivePackage", {
				type: "roundOver",
				data: {
					roundWinner: cardPlayer.getUser().getUsername(),
					roundWinnerId: cardPlayer.getUser().getSocketId(),
					winningCard: clientCardId,
					playerInfo: game.getAllPlayerInfo(),
					possibleBlackCards: possibleBlackCards
				}
			})
		}
	},
	gameStateChanged: function(usersInGame, data) {
		for (var i=0; i<usersInGame.length; i++) {
			io.to(usersInGame[i].getUser().getSocketId()).emit("_receivePackage", {
				type: "gameStateChanged",
				data: data
			})
		}
	}
}

module.exports = Broadcaster;