
// Validator defaults
$.validator.setDefaults({
    highlight: function(element) {
        $(element).closest('.form-group').addClass('has-error');
    },
    unhighlight: function(element) {
        $(element).closest('.form-group').removeClass('has-error');
    },
    errorElement: 'span',
    errorClass: 'help-block',
    errorPlacement: function(error, element) {
        if(element.parent('.input-group').length) {
            error.insertAfter(element.parent());
        } else if(element.parent().parent('.input-group').length) {
            error.insertAfter(element.parent().parent());
        } else {
            error.insertAfter(element);
        }
    }
});

$.validator.addMethod('alphanum', function(value, element) {
	return this.optional(element) || /^[a-z0-9]+$/i.test(value);
}, 'Only letters and numbers are allowed');

$.fn.updateTimeStamp = function() {
    var $this = $(this);
    var time = $this.attr('title');
    time = moment(time).calendar();
    $this.text(time);
};

$(function() {

    // Refresh timestamps just after midnight

    var oneMinutePastMidnight = moment()
                                .endOf('day')
                                .add(1, 'minutes')
                                .diff(moment());

    var interval = moment.duration(24, 'hours').asMilliseconds();

    setTimeout(function() {
        setInterval(function() {
            $('time').each(function() {
                $(this).updateTimeStamp();
            });
        }, interval);
    }, oneMinutePastMidnight);

});
//Code added by Irfan Ahmed
//////

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}
function checkCookie() {
    var login_tour = getCookie("login_tourc");
    if (login_tour == "") {

            setCookie("login_tourc", '1', 36500);
			show_login_tour = true;
    }
}
var show_login_tour = false;
checkCookie();
//////
$(document).ready(function() {
var tour = new Tour({
  steps: [
  {
    element: "#set_1",
    title: "Title of my step",
    content: "Content of my step"
  },
    {
    element: "#set_2",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#set_3",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#set_4",
	 placement: "left",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#set_5",
	 placement: "bottom",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#set_6",
	 placement: "bottom",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#set_8",
	 placement: "left",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#set_9",
	 placement: "bottom",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#set_7",
	 placement: "bottom",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#log_1",
	 placement: "left",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#log_2",
	 placement: "right",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#log_3",
	 placement: "bottom",
    title: "Title of my step",
    content: "Content of my step"
  },
   {
    element: "#log_4",
	 placement: "left",
    title: "Title of my step",
    content: "Content of my step"
  },
 
]});

	if ( show_login_tour ){
		tour.init("#set_1")
		tour.start(true)
	}

	if( $('.txt_start_tour').val() == '1' ){
		tour.init("#set_1")
		tour.start(true)
	}

	var tour_page = '';
	if( window.location.pathname == '/' )
		tour_page = 'chat_tour';

	$('body').on('click', 'button' ,function(){
		
		//var 
		if( $(this).attr('data-role') == 'end' )
			$.post('./account/updateUserState', {tour_page: tour_page}, function(data){});
	});

});