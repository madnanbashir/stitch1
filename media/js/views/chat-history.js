/*
 * UPLOAD/FILE VIEWS
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ChatHistoryView = Backbone.View.extend({
        initialize: function(options) {
            this.template = Handlebars.compile($('#template-chat-history').html());
            this.rooms = options.rooms;
            this.rooms.on('chat:show', this.render, this);
        },
        render: function(room) {
            this.$el.html(this.template(room.toJSON()));

            var transcript = new window.LCB.TranscriptView({
                el: this.$el,
                room: {
                    id: room.id,
                    name: room.get('name')
                }
            });

            this.show();
        },
        show: function() {
            this.$el.modal('show');
        },
        hide: function() {
            this.$el.modal('hide');
        }
    });

}(window, $, _);
