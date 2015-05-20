'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),

    _ = require('lodash'),
    ConnectionCollection = require('./connection-collection'),
    mongoose = require('mongoose');


function Room(roomId, roomSlug) {
    EventEmitter.call(this);
    this.roomId = roomId;
    this.roomSlug = roomSlug;
    this.connections = new ConnectionCollection();
    this.userCount = 0;

    this.getUsers = this.getUsers.bind(this);
    this.getUserIds = this.getUserIds.bind(this);
    this.getUsernames = this.getUsernames.bind(this);
    this.containsUser = this.containsUser.bind(this);

    this.emitUserJoin = this.emitUserJoin.bind(this);
    this.emitUserLeave = this.emitUserLeave.bind(this);
    this.addConnection = this.addConnection.bind(this);
    this.removeConnection = this.removeConnection.bind(this);
}

util.inherits(Room, EventEmitter);

Room.prototype.getUsers = function() {
    return this.connections.getUsers();
};

Room.prototype.getUserIds = function() {
    return this.connections.getUserIds();
};

Room.prototype.getUsernames = function() {
    return this.connections.getUsernames();
};

Room.prototype.getOfflineUsers = function(cb) {
    var onlineUsers = this.connections.getUserIds();

    var Room = mongoose.model('Room');
    Room.findOne({ _id: this.roomId })
        .populate('users')
        .exec(function(err, room) {
            if (err) {
                return cb(err);
            }

            var allUsers = room.users;
            var offlineUserIds = _.map(allUsers, function(user) {
                return user._id.toString();
            });

            for(var i = 0; i < onlineUsers.length; i++)
            {
                //remove online user from offline users
                var index = offlineUserIds.indexOf(onlineUsers[i]);
                if (index > -1) {
                    offlineUserIds.splice(index, 1);
                }
            }

            var offlineUsers = [];
            for(var i = 0; i < allUsers.length; i++)
            {
                //remove online user from offline users
                var index = offlineUserIds.indexOf(allUsers[i]._id.toString());
                if (index > -1) {
                    offlineUsers.push(allUsers[i]);
                }
            }

            cb(null, offlineUsers);
        });
};

Room.prototype.containsUser = function(userId) {
    return this.getUserIds().indexOf(userId) !== -1;
};

Room.prototype.emitUserJoin = function(data) {
    this.userCount++;
    this.emit('user_join', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        username: data.username
    });
};

Room.prototype.emitUserLeave = function(data) {
    this.userCount--;
    this.emit('user_leave', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        username: data.username
    });
};

Room.prototype.usernameChanged = function(data) {
    if (this.containsUser(data.userId)) {
        // User leaving room
        this.emitUserLeave({
            userId: data.userId,
            username: data.oldUsername
        });
        // User rejoining room with new username
        this.emitUserJoin({
            userId: data.userId,
            username: data.username
        });
    }
};

Room.prototype.addConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to add an invalid connection was detected');
        return;
    }

    if (connection.user && connection.user.id &&
        !this.containsUser(connection.user.id)) {
        // User joining room
        this.emitUserJoin({
            userId: connection.user.id,
            username: connection.user.username
        });
    }
    this.connections.add(connection);
};

Room.prototype.removeConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to remove an invalid connection was detected');
        return;
    }

    if (this.connections.remove(connection)) {
        if (connection.user && connection.user.id &&
            !this.containsUser(connection.user.id)) {
            // Leaving room altogether
            this.emitUserLeave({
                userId: connection.user.id,
                username: connection.user.username
            });
        }
    }
};


Room.prototype.addUser = function(id, userId, cb) {
    var Room = mongoose.model('Room');

    Room.update(
        { _id: id },
        { $addToSet: { users: userId } },function (err) {
            if(err){
                return cb(err);
            }
            cb(null);
        }
    );
};

Room.prototype.removeUser = function(id, userId, cb) {
    var Room = mongoose.model('Room');

    Room.update(
        { _id: id },
        { $pull: { users: userId } },function (err) {
            if(err){
                return cb(err);
            }
            cb(null);
        }
    );
};

module.exports = Room;
