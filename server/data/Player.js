var Player = function(_user) {
	var player = this;
	var user = _user,
		hand = [],
		score = 0,
		skipCount = 0;

	player.getUser = function() {
        return user;
    }

    player.getScore = function() {
        return score;
    }

    player.setScore = function(newScore) {
        score = newScore;
    }
    player.increaseScore = function() {
        score++;
    }
    player.decreaseScore = function() {
        score--;
    }
    player.changeScore = function(offset) {
        score += offset;
    }
    player.resetScore = function() {
        score = 0;
    }

    player.getSkipCount = function() {
        return skipCount;
    }
    player.resetSkipCount = function() {
        skipCount = 0;
    }

    player.getHand = function() {
        return hand;
    }
    player.setHand = function(newHand) {
        hand = newHand;
    }

    player.toString = function() {
        return String.format("{0} ({1}, {2})", user.toString(), score, skipCount);
    }

	return player;
}

module.exports = Player;