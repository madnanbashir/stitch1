'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    helpers = require('./helpers'),
    mailService = require('../emails/mailService'),
    thisHost = 'localhost:5000';

function MessageManager(options) {
    this.core = options.core;
}

MessageManager.prototype.create = function(options, cb) {
    var Message = mongoose.model('Message'),
        Room = mongoose.model('Room'),
        User = mongoose.model('User');

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        if (!room) {
            return cb('Room does not exist.');
        }
        if (room.archived) {
            return cb('Room is archived.');
        }
        Message.create(options, function(err, message) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            // Touch Room's lastActive
            room.lastActive = message.posted;
            room.save();
            // Temporary workaround for _id until populate can do aliasing
            User.findOne(message.owner, function(err, user) {
                if (err) {
                    console.error(err);
                    return cb(err);
                }
                typeof cb === 'function' && cb(null, message, room, user);
                this.core.emit('messages:new', message, room, user);

                this.emailNotifyOfflineUsers(room, message, user, function (err) {
                    if (err) console.error(err);
                });
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

MessageManager.prototype.list = function(options, cb) {
    options = options || {};

    if (!options.room) {
        return cb(null, []);
    }

    options = helpers.sanitizeQuery(options, {
        defaults: {
            reverse: true,
            take: 500
        },
        maxTake: 5000
    });

    var Message = mongoose.model('Message'),
        User = mongoose.model('User');

    var find = Message.find({
        room: options.room
    });

    if (options.since_id) {
        find.where('_id').gt(options.since_id);
    }

    if (options.from) {
        find.where('posted').gt(options.from);
    }

    if (options.to) {
        find.where('posted').lte(options.to);
    }

    if (options.query) {
        find = find.find({$text: {$search: options.query}});
    }

    if (options.expand) {
        var includes = options.expand.replace(/\s/, '').split(',');

        if (_.includes(includes, 'owner')) {
            find.populate('owner', 'id username displayName position email avatar');
        }

        if (_.includes(includes, 'room')) {
            find.populate('room', 'id name');
        }
    }

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.reverse) {
        find.sort({ 'posted': -1 });
    } else {
        find.sort({ 'posted': 1 });
    }

    find.limit(options.take)
        .exec(function(err, messages) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, messages);
        });
};

MessageManager.prototype.emailNotifyOfflineUsers = function(room, message, sender, cb){
    this.core.presence.rooms.getOrAdd(room._id, room.slug).getOfflineUsers(function (err, offlineUsers) {
        if(err){
            return cb(err);
        }

        offlineUsers.forEach(function (offlineUser) {
            var mailConfig = {
                subject: sender.displayName + ' has sent you a direct message on Stitch',
                receiver: offlineUser,
                loginUrl: 'http://' + thisHost + '/login',
                senderName: sender.displayName,
                message: message.text
            };

            mailService.sendEmail('offline-email', mailConfig);
        });

        cb(null);
    });
};

module.exports = MessageManager;
