'use strict';

var mongoose = require('mongoose'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['vcard-temp'];
    },

    then: function(cb) {
<<<<<<< HEAD
        var jid = helper.getUserJid(this.connection.user.username);
=======
        var jid = this.connection.jid();
>>>>>>> 2de6673cb66cec396ce2c39b98f14d7879b59227
        var other = this.to && this.to !== jid;

        if (!other) {
            return this.sendVcard(this.connection.user, cb);
        }

        var username = this.to.split('@')[0];
        var user = this.core.presence.users.getByUsername(username);

        if (user) {
            return this.sendVcard(user, cb);
        }

        var User = mongoose.model('User');
        User.findByIdentifier(username, function(err, user) {
            if (user) {
                this.sendVcard(user, cb);
            }
        });
    },

    sendVcard: function(user, cb) {
        var stanza = this.Iq();

        var vcard = stanza.c('vCard', {
            xmlns: 'vcard-temp'
        });

        vcard.c('FN').t(user.firstName + ' ' + user.lastName);

<<<<<<< HEAD
=======
            v.c('JABBERID').t(this.connection.getUserJid(user.username));
>>>>>>> 2de6673cb66cec396ce2c39b98f14d7879b59227

        var name = vcard.c('N');
        name.c('GIVEN').t(user.firstName);
        name.c('FAMILY').t(user.lastName);

        vcard.c('NICKNAME').t(user.username);

        vcard.c('JABBERID').t(helper.getUserJid(user.username));

        var userId = (user.id || user._id).toString();

        var avatar = this.core.avatars.get(userId);
        if (avatar) {
            var photo = vcard.c('PHOTO');
            photo.c('TYPE').t('image/jpeg');
            photo.c('BINVAL').t(avatar.base64);
        }

        cb(null, stanza);
    }

});
