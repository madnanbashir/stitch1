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

    app.post('/mail/invitation/:email', function(req, res){
        crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');

            var mailConfig = {
                subject: 'Welcome to Stitch Technologies!',
                receiver: {
                    email: req.params.email
                },
                joinTeamUrl: hostUrl + '/login/' + token
            };

            mailService.sendEmail('invitation', mailConfig);

            res.send({
                message: 'invitation mail sent'
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
