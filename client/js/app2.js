var socket,
	app,
	messages;

angular.module("handlers", [])
	.factory("PackageHandler", function($rootScope, $location) {
		var handler = function(data) {
			switch (data.type) {
				case "connection":
					$rootScope.$apply(function() {
						$location.path("/lobby").replace();
					});
					break;
				case "chat":
					if ($rootScope.currentGame) {
						if (document.querySelector("div.messages#messages-container")) {
							document.querySelector("div.messages#messages-container").innerHTML += "[" + data.data.time + "] &lt;" + data.data.user + "&gt; " + data.data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "<br>";
							messages.scrollToBottom();
						}
					}
					break;
				case "joinedGame":
					$rootScope.$apply(function() {
						$location.path("/game/" + data.data.gameId).replace();
						
						$rootScope.currentGame = {
							id: data.data.gameId,
							gameState: 3,
							blackCards: []
						}
					});
					break;
				case "playerJoinedGame":
					if ($rootScope.currentGame) {
						$rootScope.$apply(function() {
							$rootScope.currentGame.connectedUsers = data.data.usernames;
							$rootScope.currentGame.host = data.data.host;
							$rootScope.currentGame.playerInfo = data.data.playerInfo;
						});
					}
					break;
				case "updateGameList":
					$rootScope.$apply(function() {
						$rootScope.gameList = data.data.gameList;
					});
					break;
				case "updateHand":
					if ($rootScope.currentGame) {
						$rootScope.$apply(function() {
							$rootScope.currentGame.hand = JSON.parse(data.data.hand);
						});
					}
					break;
				case "gameStateChanged":
					if ($rootScope.currentGame) {
						$rootScope.$apply(function() {
							$rootScope.currentGame.gameState = data.data.gameState;
							$rootScope.currentGame.roundWinner = undefined;
							$rootScope.currentGame.winningCard = undefined;
							
							if (data.data.blackCard) {
								$rootScope.currentGame.blackCard = JSON.parse(data.data.blackCard);
								$rootScope.currentGame.blackCards = [];
							}

							if (data.data.blindRound) {
								$rootScope.currentGame.nextRoundBlind = data.data.blindRound;
							} else {
								$rootScope.currentGame.nextRoundBlind = false;
							}
							
							if (data.data.whiteCards) {
								$rootScope.currentGame.whiteCards = JSON.parse(data.data.whiteCards);
							}
							
							if (data.data.judge) {
								$rootScope.currentGame.judge = data.data.judge;
							}
							
							if (data.data.playerInfo) {
								$rootScope.currentGame.playerInfo = data.data.playerInfo;
							}
						});
					}
					break;
				case "playerInfoChanged":
					if ($rootScope.currentGame) {
						$rootScope.$apply(function() {
							$rootScope.currentGame.playerInfo = data.data.playerInfo;
						});
					}
					break;
				case "roundOver":
					if ($rootScope.currentGame) {
						$rootScope.$apply(function() {
							$rootScope.currentGame.playerInfo = data.data.playerInfo;
							$rootScope.currentGame.roundWinner = data.data.roundWinnerId;
							$rootScope.currentGame.winningCard = data.data.winningCard;
							
							if (data.data.roundWinnerId == socket.id) {
								app.notify("You received a point", "You have just received a point from the czar!");
							}

							if (data.data.possibleBlackCards && $rootScope.currentGame.judge == socket.id) {
								$rootScope.currentGame.blackCards = data.data.possibleBlackCards;
							}
						});
					}
					break;
				default: break;
			}
		};
		
		return handler;
	});

angular.module("oregon", ["ngRoute", "handlers"])
	.filter("trust", ['$sce', function($sce) {
		return function(htmlCode){
			return $sce.trustAsHtml(htmlCode);
		}
	}])
	.controller("ViewController", function($location) {
		if (!socket) {
			$location.path('/').replace();
		}
		
		app = new metroUI({
			keyboard: false
		});
	})
	.controller("LoginViewController", function($scope, PackageHandler) {
		app.init();

		$scope.connect = function() {
			var name = document.querySelector("input#username").value;
			
			if (name.length < 1) {
				return;
			}
			
			$scope.waitingForConnection = true;
			
			socket = io.connect("http://" + location.hostname + ":8080", {
				secure: true,
				multiplex: false,
				'force new connection': true,
				query: "username=" + name
			});
			
			socket.on("_receivePackage", PackageHandler);
		}

		$scope.inputKeydown = function(event) {
			if (event.keyCode === 13 && document.querySelector("input#username").value.length != 0) {
				$scope.connect();
			}
		}
	})
	.controller("LobbyViewController", function($scope, $location) {
		app.init();
		
		$scope.disconnect = function() {
			$location.path('/').replace();
			socket.io.disconnect(true);
		}
		
		$scope.createGame = function() {
			socket.emit("_sendPackage", { type: "createGame" });
		}
		
		$scope.joinGame = function(gameId) {
			socket.emit("_sendPackage", { type: "joinGame", data: { gameId: gameId }});
		}
	})
	.controller("GameViewController", function($scope, $location, $rootScope, $sce) {
		app.init();
		
		var messageTimeout;
		
		messages = new app.Messages({
			page: "div.page[data-page=\"game\"]",
			messageReroute: function(messageText) {
				if (messageText != null && messageText.length > 0) {
					socket.emit("_sendPackage", { type: "chat", data: { message: messageText }});
				}
			}
		});

		$scope.socket = socket;
		
		$scope.leaveGame = function() {
			socket.emit("_sendPackage", { type: "leaveGame" });
			$location.path('/lobby').replace();
		}
		
		$scope.startGame = function() {
			socket.emit("_sendPackage", { type: "startGame", data: { gameId: $rootScope.currentGame.id }});
		}
		
		$scope.playCard = function(card) {
			if (!$rootScope.currentGame) {
				return;
			}
			
			if ($rootScope.currentGame.blackCard.pick <= 0) {
				return;
			} else {
				$rootScope.currentGame.blackCard.pick--;
			}

			if (card.id == "blank") {
				var input = prompt("Enter the text you wish to write on the card:", "");
				if (input == null || input == "") {
					$rootScope.currentGame.blackCard.pick++;
					return;
				} else {
					card.text = input;
				}
			}
			
			socket.emit("_sendPackage", {
				type: "playCard",
				data: {
					card: JSON.stringify(card)
				}
			});
			
			$rootScope.currentGame.hand.splice($rootScope.currentGame.hand.indexOf(card), 1);
		}
		
		$scope.judgeCard = function(card) {
			if (!$rootScope.currentGame || $rootScope.currentGame.judge != socket.id) {
				return;
			}
			
			socket.emit("_sendPackage", {
				type: "judgeCard",
				data: {
					card: JSON.stringify(card)
				}
			});
		}

		$scope.setBlackCard = function(card) {
			if (!$rootScope.currentGame || $rootScope.currentGame.judge != socket.id) {
				return;
			}
			
			socket.emit("_sendPackage", {
				type: "setBlackCard",
				data: {
					card: JSON.stringify(card)
				}
			});

			$rootScope.currentGame.blackCards = null;
		}
		
		$scope.renderHtml = function(html_code) {
			return $sce.trustAsHtml(html_code);
		}
		
		$scope.combineCards = function(blackCard, whiteCards) {
			var text = "";
			for (var i=0; i<blackCard.length; i++) {
				text += blackCard[i];
				
				if (whiteCards[i]) {
					text += "<em class=\"highlight accent-color\">" + whiteCards[i].text + "</em>";
				}
			}
			
			return $sce.trustAsHtml(text);
		}
	})
	.config(function($routeProvider, $locationProvider) {
		$routeProvider
		.when('/', {
			templateUrl: 'static/login.html',
			controller: "LoginViewController",
 		})
 		.when('/lobby/', {
 			templateUrl: 'static/lobby.html',
 			controller: "LobbyViewController"
 		})
 		.when('/game/:gameId', {
 			templateUrl: 'static/game.html',
 			controller: "GameViewController"
 		})
 	});