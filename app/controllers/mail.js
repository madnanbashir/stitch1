//
// Account Controller
//

'use strict';

var fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose'),
    mandrillService = require('../emails/mandrillService'),
    crypto = require('crypto'),
    hostUrl = 'http://localhost:5000';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //

    app.post('/mail/inviteProvider', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            if(err){
                return callback(err);
            }

            var token = buffer.toString('hex');

            core.account.create('local', {
                email: req.body.receiverEmail,
                verificationToken: token,
                isVerified: false,

                provider: 'local',
                username: 'username' + token,
                password: 'password' + token,
                firstName: 'firstName' + token,
                lastName: 'lastName' + token,
                displayName: 'displayName' + token,
                position: 'position' + token,
                organizationName: 'organizationName' + token,
                organizationDomain: 'organizationDomain' + token,
                inviterId: req.user._id,
                invitationMessage: req.body.invitationMessage,
                invitationRoomId: req.body.invitationRoomId

            }, function (err, user) {
                if(err){
                    console.log(err);
                    return res.sendStatus(504);
                }

                var templateName = 'sign-up-3-you-re-invited';

                var message = {
                    subject: req.body.inviterName + ' has invited you to join ' + req.body.inviterOrg + ' on Stitch',
                    to: [{
                        email: req.body.receiverEmail
                    }],
                    merge: true,
                    merge_language: 'mailchimp',
                    global_merge_vars: [
                        {
                            name: 'joinTeamUrl',
                            content: 'http://' + req.headers.host + '/register?token=' + token + '&email=' + req.body.receiverEmail
                        },
                        {
                            name: 'inviterName',
                            content: req.body.inviterName
                        },
                        {
                            name: 'inviterOrg',
                            content: req.body.inviterOrg
                        },
                        {
                            name: 'receiverEmail',
                            content: req.body.receiverEmail
                        }
                    ]
                };

                mandrillService.sendEmail(templateName, [], message, function(){});

                res.status(201).send({
                    message: 'invitation mail sent'
                });
            });
        });
    });
};
