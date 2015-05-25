/* global Backbone, _, Tour */
/*
 * TOUR VIEW
 */

// 'use strict';

(function(window, $, _) {
    window.LCB = window.LCB || {};

    window.LCB.TourView = Backbone.View.extend({
        initialize: function() {
            this.tour = new Tour({
                delay: false,
                steps: [
                    {
                        title: 'Welcome to 1',
                        content: 'Content 1',
                        container: '.lcb-pane',
                        orphan: true
                    },
                    {
                        title: 'Welcome to 2',
                        content: 'Content 2',
                        container: '.lcb-pane',
                        orphan: true
                    },
                    {
                        title: 'Welcome to 3',
                        content: 'Content 3',
                        container: '.lcb-pane',
                        orphan: true
                    },
                ]
            });
            // this.tour.init();
            // this.tour.start();
        }
    });
})(window, $, _);
