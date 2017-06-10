var ConnectedUsers = function() {
	var connectedUsers = this;
	var users = {};

	var MAX_USERS = 100;

	connectedUsers.hasUser = function(socketId) {
		return users[socketId] != null;
	}

	connectedUsers.getUser = function(socketId) {
        return users[socketId];
    }

	connectedUsers.checkAndAdd = function(user) {
		if (this.hasUser(user.getSocketId())) {
			console.log(String.format("[{0}] Rejecting existing user {1}", process.uptime(), user.toString()));
			return false;
		} else if (Object.keys(users).length >= MAX_USERS && !user.isAdmin()) {
			console.log(String.format("[{0}] Rejecting user {1} due to too many users", process.uptime(), user.toString()));
			return false;
		} else {
			console.log(String.format("[{0}] New user {1} connected (admin={2})", process.uptime(), user.toString(), user.isAdmin()));
			users[user.getSocketId()] = user;

			var usernames = [];
			for (var _user in users) {
                usernames.push(users[_user].getUsername());
			}

			Broadcaster.userJoined(usernames);

			return true;
		}
	}

	connectedUsers.removeUser = function(user, reason) {
        if (users[user.getSocketId()]) {
            console.log(String.format("[{0}] Removing user {1} because {2}", process.uptime(), user.toString(), reason));
 			user.noLongerValid();
            delete users[user.getSocketId()];

            notifyRemoveUser(user,reason);
        }
    }

	var notifyRemoveUser = function(user, reason) {
		var usernames = [];
        for (var _user in users) {
            usernames.push(users[_user].getUsername());
        }

		Broadcaster.userLeft(usernames);
	}

	return connectedUsers;
}

module.exports = ConnectedUsers;