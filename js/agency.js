/*!
 * Start Bootstrap - Agency Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Enable popovers
$(function () {
  $('[data-toggle="popover"]').popover()
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

function loadBackground() {
    document.getElementById("bigheader").style.backgroundImage = "url('img/header-bg-" + (Math.floor(Math.random() * (53)) + 1) + ".jpg')";
}

function showStatus() {
    getJSON("http://awesome-botmakersinc.rhcloud.com/botdata", function(totals) {
        getJSON("https://awesomebot-botmakersinc.rhcloud.com/data?section=list&type=bot", function(data) {
            if(data && totals) {
                document.getElementById("addtoserverlink").href = data.oauthurl;
                document.getElementById("awesomestatus").innerHTML = "Serving " + totals.svrcount + " servers and " + totals.usrcount + " users. Uptime: " + data.uptime;
            }
        });
    });
    setTimeout(function() {
        showStatus();
    }, 900000);
}
function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.responseType = "json";
    xhr.onload = function() {
        var status = xhr.status;
        callback(xhr.response);
    };
    xhr.send();
};