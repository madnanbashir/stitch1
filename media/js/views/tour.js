/* global Backbone, _, Tour, Handlebars */
/*
 * TOUR VIEW
 */

// 'use strict';

(function(window, $, _) {
    window.LCB = window.LCB || {};

    window.LCB.TourView = Backbone.View.extend({
        initialize: function() {
            var templateWelcome = Handlebars.compile($('#template-tour-welcome').html());

            this.tour = new Tour({
                delay: false,
                steps: [
                    {
                        title: 'Welcome to 1',
                        content: 'Content 1',
                        container: '.lcb-pane',
                        orphan: true,
                        template: function(i, step) {
                            console.log(i);
                            console.log(step);
                            console.log('TEMPLATE!!!!!');
                            var val = templateWelcome();
                            return val;
                        }
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
            this.tour.init();
            this.tour.start();
        }
    });
})(window, $, _);
