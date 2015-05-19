//
// Account Controller
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    passport = require('passport'),
    crypto = require('crypto'),
    auth = require('./../auth/index'),
    path = require('path'),
    settings = require('./../config'),
    mailService = require('../emails/mailService');

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    core.on('account:update', function(data) {
        app.io.emit('users:update', data.user);
    });

    //
    // Routes
    //
    app.get('/', middlewares.requireLogin.redirect, function(req, res) {
        res.render('chat.html', {
            account: req.user,
            settings: settings
        });
    });

    app.get('/login', function(req, res) {
        var imagePath = path.resolve('media/img/photos');
        var images = fs.readdirSync(imagePath);
        var image = _.chain(images).filter(function(file) {
            return /\.(gif|jpg|jpeg|png)$/i.test(file);
        }).sample().value();

        if(req.query.token && req.query.email) {
            verifyUser(req.query.email, req.query.token, function (err, verificationMessage, user) {

                if(verificationMessage.isVerified) {
                    var mailConfig = {
                        subject: 'You’re all set up!',
                        receiver: {
                            email: user.email
                        },
                        inviteTeamUrl: 'http://' + req.headers.host + '/login',
                        organizationName: user.organizationName
                    };

                    mailService.sendEmail('confirmation', mailConfig);
                }

                res.render('login.html',{
                    photo: image,
                    auth: auth.providers,
                    verificationMessage: verificationMessage
                })
            })
        } else {
            res.render('login.html', {
                photo: image,
                auth: auth.providers
            });
        }
    });

    app.get('/register', function(req, res) {

        var imagePath = path.resolve('media/img/photos');
        var images = fs.readdirSync(imagePath);
        var image = _.chain(images).filter(function(file) {
            return /\.(gif|jpg|jpeg|png)$/i.test(file);
        }).sample().value();

        if(req.query.token && req.query.email) {
            verifyUser(req.query.email, req.query.token, function (err, verificationMessage) {
                res.render('register.html',{
                    photo: image,
                    auth: auth.providers,
                    email: req.query.email,
                    organization: req.query.organization,
                    verificationMessage: verificationMessage
                })
            })
        } else {
            res.render('login.html', {
                photo: image,
                auth: auth.providers
            });
        }
    });

    app.post('/get-started', function(req, res) {
        crypto.randomBytes(20, function (err, buffer) {
            if(err){
                return callback(err);
            }

            var token = buffer.toString('hex');

            core.account.create('local', {
                email: req.body.Email,
                organizationName: req.body.Organization,
                organizationDomain: req.body.Email.substr((req.body.Email.indexOf("@") + 1)),
                verificationToken: token,
                isVerified: false,

                provider: 'local',
                username: 'username' + token,
                password: 'password' + token,
                firstName: 'firstName' + token,
                lastName: 'lastName' + token,
                displayName: 'displayName' + token,
                position: 'position' + token
            }, function (err, user) {
                if(err){
                    console.log(err);
                    return res.sendStatus(504);
                }

                var mailConfig = {
                    subject: 'Invitation to Stitch',
                    receiver: {
                        email: req.body.Email
                    },
                    getStartedUrl: 'http://' + req.headers.host + '/register?token=' + token + '&email=' +
                        req.body.Email + '&organization=' + req.body.Organization
                };

                mailService.sendEmail('get-started', mailConfig);

                res.sendStatus(200);
            });
        });
    });

    app.get('/verify-mail', function(req, res) {
        var imagePath = path.resolve('media/img/photos');
        var images = fs.readdirSync(imagePath);
        var image = _.chain(images).filter(function(file) {
            return /\.(gif|jpg|jpeg|png)$/i.test(file);
        }).sample().value();
        res.render('verify-mail.html', {
            photo: image,
            auth: auth.providers
        });
    });

    app.get('/logout', function(req, res ) {
        req.session.destroy();
        res.redirect('/login');
    });

    app.post('/account/login', function(req, res) {
        req.io.route('account:login');
    });

    app.post('/account/register', function(req, res) {
        req.io.route('account:register');
    });

    app.get('/account', middlewares.requireLogin, function(req, res) {
        req.io.route('account:whoami');
    });

    app.post('/account/profile', middlewares.requireLogin, function(req, res) {
        req.io.route('account:profile');
    });

    app.post('/account/settings', middlewares.requireLogin, function(req, res) {
        req.io.route('account:settings');
    });

    app.post('/account/token/generate', middlewares.requireLogin, function(req, res) {
        req.io.route('account:generate_token');
    });

    app.post('/account/token/revoke', middlewares.requireLogin, function(req, res) {
        req.io.route('account:revoke_token');
    });

    //
    // Sockets
    //
    app.io.route('account', {
        whoami: function(req, res) {
            res.json(req.user);
        },
        profile: function(req, res) {
            var form = req.body || req.data,
                data = {
                    displayName: form.displayName || form['display-name'],
                    firstName: form.firstName || form['first-name'],
                    lastName: form.lastName || form['last-name'],
                    position: form.position || form['position']
                };

            core.account.update(req.user._id, data, function (err, user) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to update your profile.',
                        errors: err
                    });
                }

                if (!user) {
                    return res.sendStatus(404);
                }

                res.json(user);
            });
        },
        settings: function(req, res) {
            if (req.user.using_token) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot change account settings ' +
                             'when using token authentication.'
                });
            }

            var form = req.body || req.data,
                data = {
                    username: form.username,
                    email: form.email,
                    currentPassword: form.password ||
                        form['current-password'] || form.currentPassword,
                    newPassword: form['new-password'] || form.newPassword,
                    confirmPassowrd: form['confirm-password'] ||
                        form.confirmPassword
                };

            auth.authenticate(req, req.user.uid || req.user.username,
                              data.currentPassword, function(err, user) {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'There were problems authenticating you.',
                        errors: err
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Incorrect login credentials.'
                    });
                }

                core.account.update(req.user._id, data, function (err, user, reason) {
                    if (err || !user) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Unable to update your account.',
                            reason: reason,
                            errors: err
                        });
                    }
                    res.json(user);
                });
            });
        },
        generate_token: function(req, res) {
            if (req.user.using_token) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot generate a new token ' +
                             'when using token authentication.'
                });
            }

            core.account.generateToken(req.user._id, function (err, token) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to generate a token.',
                        errors: err
                    });
                }

                res.json({
                    status: 'success',
                    message: 'Token generated.',
                    token: token
                });
            });
        },
        revoke_token: function(req, res) {
            if (req.user.using_token) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot revoke token ' +
                             'when using token authentication.'
                });
            }

            core.account.revokeToken(req.user._id, function (err) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to revoke token.',
                        errors: err
                    });
                }

                res.json({
                    status: 'success',
                    message: 'Token revoked.'
                });
            });
        },
        register: function(req, res) {

            if (req.user ||
                !auth.providers.local ||
                !auth.providers.local.enableRegistration) {

                return res.status(403).json({
                    status: 'error',
                    message: 'Permission denied'
                });
            }

            var fields = req.body || req.data;

            // Sanity check the password
            var passwordConfirm = fields.passwordConfirm || fields.passwordconfirm || fields['password-confirm'];

            if (fields.password !== passwordConfirm) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Password not confirmed'
                });
            }

            var data = {
                provider: 'local',
                username: fields.username,
                email: fields.email,
                password: fields.password,
                verificationToken: fields.token,
                firstName: fields.firstName || fields.firstname || fields['first-name'],
                lastName: fields.lastName || fields.lastname || fields['last-name'],
                displayName: fields.displayName || fields.displayname || fields['display-name'],
                position: fields.position || fields.position || fields['position'],
                organizationName: fields.organization,
                organizationDomain: fields.email.substr((fields.email.indexOf("@") + 1))
            };

            getUserVerification(data, req.headers.host, function (err, data) {

                core.account.create('local', data, function(err, user) {
                    if (err) {
                        var message = 'Sorry, we could not process your request';
                        // User already exists
                        if (err.code === 11000) {
                            message = 'Email has already been taken';
                        }
                        // Invalid username
                        if (err.errors) {
                            message = _.map(err.errors, function(error) {
                                return error.message;
                            }).join(' ');
                            // If all else fails...
                        } else {
                            console.error(err);
                        }
                        // Notify
                        return res.status(400).json({
                            status: 'error',
                            message: message
                        });
                    }

                    if(data.isVerified){

                        var mailConfig = {
                            subject: 'You’re all set up!',
                            receiver: {
                                email: data.email
                            },
                            inviteTeamUrl: 'http://' + req.headers.host + '/login',
                            organizationName: data.organizationName
                        };

                        mailService.sendEmail('confirmation', mailConfig);

                        return res.status(201).json({
                            status: 'success',
                            message: 'You\'ve been registered, ' +
                            'please try logging in now!'
                        });
                    } else{

                        return res.status(201).json({
                            status: 'success',
                            message: 'You\'ve been registered, ' +
                            'please check your mail to activate your account'
                        });
                    }
                });
            });
        },
        login: function(req, res) {
            auth.authenticate(req, function(err, user, info) {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'There were problems logging you in.',
                        errors: err
                    });
                }

                if (!user && info && info.locked) {
                    return res.status(403).json({
                        status: 'error',
                        message: info.message || 'Account is locked.'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        status: 'error',
                        message: info && info.message ||
                                 'Incorrect login credentials.'
                    });
                }

                req.login(user, function(err) {
                    if (err) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'There were problems logging you in.',
                            errors: err
                        });
                    }
                    var temp = req.session.passport;
                    req.session.regenerate(function(err) {
                        if (err) {
                            return res.status(400).json({
                                status: 'error',
                                message: 'There were problems logging you in.',
                                errors: err
                            });
                        }
                        req.session.passport = temp;
                        res.json({
                            status: 'success',
                            message: 'Logging you in...'
                        });
                    });
                });
            });
        }
    });

    function verifyUser(email, token, callback){
        User.findOne({email: email}, function (err, user) {
            if (err || !user) {
                return callback(err);
            }

            var isVerified = user.verificationToken === token;

            User.update({email: email}, {$set: {isVerified: isVerified}}, function (err, ret) {
                if (err) {
                    return callback(err);
                }

                if (isVerified) {
                    callback(null, {
                        text: 'User verified successfully',
                        colour: 'green',
                        isVerified: isVerified
                    }, user);
                } else {
                    callback(null, {
                        text: 'Tokens did not match',
                        colour: 'red',
                        isVerified: isVerified
                    });
                }
            });
        });
    }

    function getUserVerification(data, thisHost, callback) {

        User.findOneAndRemove({ email: data.email }, function(err, user) {
            if(err){
                return callback(err);
            }

            if (user && user.isVerified) {
                data.isVerified = true;

                return callback(null, data);
            } else {
                crypto.randomBytes(20, function (err, buffer) {
                    if(err){
                        return callback(err);
                    }

                    var token = buffer.toString('hex');

                    var mailConfig = {
                        subject: 'Invitation to Stitch',
                        receiver: {
                            email: data.email
                        },
                        confirmAccountUrl: 'http://' + thisHost + '/login?token=' + token + '&email=' + data.email
                    };

                    mailService.sendEmail('authentication', mailConfig);

                    data.verificationToken = token;
                    data.isVerified = false;

                    return callback(null, data);
                });
            }
        });
    }
};
