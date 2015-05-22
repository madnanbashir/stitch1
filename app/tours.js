/**
 * Created by user on 5/22/15.
 */
'use strict';

var mediator;

mediator = new Shepherd.Evented;

var tourTwo = new Shepherd.Tour({
    defaults: {
        classes: 'shepherd-theme-arrows'
    }
});

tourTwo.addStep('welcome', {
    text: ['You triggered a second tour'],
    attachTo: '.shep-step2',
    classes: 'shepherd shepherd-open shepherd-theme-arrows shepherd-transparent-text',
    buttons: [
        {
            text: 'Exit',
            classes: 'shepherd-button-secondary',
            action: tourTwo.cancel
        }, {
            text: 'Next',
            action: tourTwo.next,
            classes: 'shepherd-button-example-primary'
        }
    ]
});

mediator.on('first-visit', function() {
    console.log('1234567890');
    tourTwo.start();
});


// mediator.trigger('first-visit');
