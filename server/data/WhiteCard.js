var WhiteCard = function(_id, _text, _isWriteIn) {
	var whiteCard = this;

	var id = _id;
	var text = _text;
	var isWriteIn = _isWriteIn;

	whiteCard.getId = function() {
		return id;
	}

	whiteCard.getText = function() {
		return text;
	}

	whiteCard.isWriteIn = function() {
		return isWriteIn;
	}

	whiteCard.setText = function(s) {
		if (!isWriteIn) {
			return;
		}

		text = s;
	}

	whiteCard.setId = function(s) {
		if (!isWriteIn) {
			return;
		}

		id = s;
	}

	whiteCard.getClientData = function() {
		return {
			id: id,
			text: text,
			isWriteIn: isWriteIn
		}
	}

	return whiteCard;
}

module.exports = WhiteCard;