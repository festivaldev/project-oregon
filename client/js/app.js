var PackageHandler = function(data) {
	switch (data.type) {
		case "connection":
			app.views[0].loadPage("lobby");
			break;
		default: break;
	}
}

var Game = function(params) {
	var game = this;
	var games = {};
	
	game.socket = null;
	game.connect = function() {
		var name = document.querySelector("input#username").value;
			
		if (name.length < 1) {
			return;
		}

		game.socket = io.connect("http://" + location.hostname + ":8080", {
			secure: true,
			multiplex: false,
			'force new connection': true,
			query: "username="+name
		});
		
		game.socket.on("_receivePackage", PackageHandler);
	}
	
	game.disconnect = function() {
		game.socket.io.disconnect(true);
		game.socket = null;
	}
	
	game.createGame = function() {
		app.views[0].loadPage("game");
		game.socket.emit("_sendPackage", { type: "createGame" });
	}
}