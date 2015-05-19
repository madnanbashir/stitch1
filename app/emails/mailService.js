'use strict';

var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
var path = require('path');
var templatesDir = path.join(__dirname, './templates'), emailTemplates = require('email-templates');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(mandrillTransport({
    auth: {
        apiKey: 'bAaMyq6HRKH5drmbjLVDgQ'
    }
}));

function sendEmail(templateName, mailConfig, callback) {
    emailTemplates(templatesDir, function (err, template) {
        if (err) {
            console.log(err);
        }
        else {
            // set defaults
            mailConfig.from = mailConfig.from ? mailConfig.from : 'Team Stitch <founders@teamstitch.com>';

            template(templateName, mailConfig, function (err, html, text) {
                if (err) {
                    console.log(err);
                }
                else {
                    transporter.sendMail({
                        to: mailConfig.receiver.email,
                        from: mailConfig.from,
                        subject: mailConfig.subject,
                        html: html,
                        text: text
                    }, function (error, info) {
                        if (error) {
                            console.log(error);
                            if(callback) callback(error);
                        }
                        else {
                            console.log(info);
                            if(callback) callback(null, info);
                        }
                    });
                }
            });
        }
    });
}

module.exports = {
    sendEmail: sendEmail
};

