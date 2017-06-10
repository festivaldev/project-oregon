var GameOptions = function() {
	var gameOptions = this;

	var MIN_SCORE_LIMIT = 4;
    var DEFAULT_SCORE_LIMIT = 10;
    var MAX_SCORE_LIMIT = 69;
    var MIN_PLAYER_LIMIT = 3;
    var DEFAULT_PLAYER_LIMIT = 10;
    var MAX_PLAYER_LIMIT = 20;
    var MIN_BLANK_CARD_LIMIT = 0;
    var DEFAULT_BLANK_CARD_LIMIT = 0;
    var MAX_BLANK_CARD_LIMIT = 30;

    gameOptions.blanksInDeck = DEFAULT_BLANK_CARD_LIMIT;
    gameOptions.playerLimit = DEFAULT_PLAYER_LIMIT;
    gameOptions.scoreGoal = DEFAULT_SCORE_LIMIT;
    gameOptions.password = "";

    gameOptions.update = function(newOptions) {
        gameOptions.scoreGoal = newOptions.scoreGoal;
        gameOptions.playerLimit = newOptions.playerLimit;
        gameOptions.spectatorLimit = newOptions.spectatorLimit;
        gameOptions.blanksInDeck = newOptions.blanksInDeck;
        gameOptions.password = newOptions.password;
    }

    gameOptions.serialize = function(includePassword) {
        var info = {
            blanksLimit: gameOptions.blanksInDeck,
            playerLimit: gameOptions.playerLimit,
            scoreLimit: gameOptions.scoreGoal,
            password: (includePassword ? gameOptions.password : undefined)
        }

        return info;
    }

    gameOptions.deserialize = function(text) {
        var options = new GameOptions();

        var json = JSON.parse(text);
        options.blanksInDeck = Math.max(MIN_BLANK_CARD_LIMIT, Math.max(MAX_BLANK_CARD_LIMIT, json.blanksLimit));
        options.playerLimit = Math.max(MIN_BLANK_CARD_LIMIT, Math.max(MAX_BLANK_CARD_LIMIT, json.playerLimit));
        options.scoreGoal = Math.max(MIN_BLANK_CARD_LIMIT, Math.max(MAX_BLANK_CARD_LIMIT, json.scoreLimit));
        options.password = json.password;

        return options;
    }

	return gameOptions;
}

module.exports = GameOptions;