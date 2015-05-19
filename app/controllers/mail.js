//
// Account Controller
//

'use strict';

var fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose'),
    mailService = require('../emails/mailService'),
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
    app.post('/mail/authentication/:email', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');

            var mailConfig = {
                subject: 'Welcome to Stitch Technologies!',
                receiver: {
                    email: req.params.email
                },
                confirmAccountUrl: hostUrl + '/login/' + token
            };

            mailService.sendEmail('authentication', mailConfig);

            res.send({
                message: 'authentication mail sent'
            });
        });
    });

    app.post('/mail/confirmation/:email', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');

            var mailConfig = {
                subject: 'Welcome to Stitch Technologies!',
                receiver: {
                    email: req.params.email
                },
                inviteTeamUrl: hostUrl + '/login/' + token
            };

            mailService.sendEmail('confirmation', mailConfig);

            res.send({
                message: 'confirmation mail sent'
            });
        });
    });

    app.post('/mail/get-started/:email', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');

            var mailConfig = {
                subject: 'Welcome to Stitch Technologies!',
                receiver: {
                    email: req.params.email
                },
                getStartedUrl: hostUrl + '/login/' + token
            };

            mailService.sendEmail('get-started', mailConfig);

            res.send({
                message: 'get-started mail sent'
            });
        });
    });

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
                organizationDomain: 'organizationDomain' + token

            }, function (err, user) {
                if(err){
                    console.log(err);
                    return res.sendStatus(504);
                }

                var mailConfig = {
                    subject: req.body.inviterName + ' has invited you to join ' + req.body.inviterOrg + ' on Stitch',
                    receiver: {
                        email: req.body.receiverEmail
                    },
                    joinTeamUrl: 'http://' + req.headers.host + '/register?token=' + token + '&email=' + req.body.receiverEmail,
                    inviterName: req.body.inviterName,
                    inviterOrg: req.body.inviterOrg
                };

                mailService.sendEmail('invitation', mailConfig);

                res.status(201).send({
                    message: 'invitation mail sent'
                });
            });
        });
    });

    app.post('/mail/offline-email/:email', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');

            var mailConfig = {
                subject: 'Welcome to Stitch Technologies!',
                receiver: {
                    email: req.params.email
                },
                loginUrl: hostUrl + '/login/' + token
            };

            mailService.sendEmail('offline-email', mailConfig);

            res.send({
                message: 'offline-email mail sent'
            });
        });
    });
};
