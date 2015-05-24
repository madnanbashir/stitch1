'use strict';

var mandrill = require('mandrill-api/mandrill');
var mandrillClient = new mandrill.Mandrill('bAaMyq6HRKH5drmbjLVDgQ');
var path = require('path');

function sendEmail(templateName, templateContent, message, callback) {

    message.from_name =  message.from_name ? message.from_name : 'Team Stitch';
    message.from_email = message.from_email ? message.from_email : 'founders@teamstitch.com';

    mandrillClient.messages.sendTemplate({"template_name": templateName, "template_content": templateContent, "message": message}, function(result) {
        console.log(result);
        callback(null, result);
    }, function(e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        callback(e);
    });
}

module.exports = {
    sendEmail: sendEmail
};

