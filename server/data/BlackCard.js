var BlackCard = function(_id, _text, _pick) {
	var blackCard = this;

	var id = _id;
	var raw = _text;
	var text = _text.join('<span class="spacer"></span>');
	var pick = _pick;

	blackCard.getId = function() {
		return id;
	}

	blackCard.getText = function() {
		return text;
	}

	blackCard.getPick = function() {
		return pick;
	}

	blackCard.getClientData = function() {
		return {
			id: id,
			raw: raw,
			text: text,
			pick: pick
		}
	}

	return blackCard;
}

module.exports = BlackCard;