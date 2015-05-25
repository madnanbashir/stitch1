//= require vendor/bootstrap-daterangepicker/daterangepicker.js
//= require util/eggs.js
//= require util/message.js
//= require models.js
//= require views/browser.js
//= require views/room.js
//= require views/status.js
//= require views/window.js
//= require views/panes.js
//= require views/modals.js
//= require views/profilePictureModal.js
//= require views/upload.js
//= require views/client.js
//= require views/chat-history.js
//= require views/transcript.js
//= require views/tour.js
//= require client.js

$(function() {
  window.client = new window.LCB.Client({
    filesEnabled: $('#lcb-upload').length > 0
  });
  window.client.start();
});
