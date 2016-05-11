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

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

var awesome = true;
function switchNames() {
    if(awesome) {
        $("body").contents().each(function () {
            if (this.nodeType === 3) this.nodeValue = $.trim($(this).text()).replace(/AwesomeBot/g, "AwfulBot")
            if (this.nodeType === 1) $(this).html( $(this).html().replace(/AwesomeBot/g, "AwfulBot") )
        })
    } else {
        $("body").contents().each(function () {
            if (this.nodeType === 3) this.nodeValue = $.trim($(this).text()).replace(/AwfulBot/g, "AwesomeBot")
            if (this.nodeType === 1) $(this).html( $(this).html().replace(/AwfulBot/g, "AwesomeBot") )
        })
    }
    awesome = !awesome;
}

function showStatus() {
    getJSON("https://awesomebot-botmakersinc.rhcloud.com/data?section=list&type=bot", function(data) {
        if(data) {
            document.getElementById("addtoserverlink").href = data.oauthurl;
            document.getElementById("awesomestatus").innerHTML = "Serving " + data.servers + " servers and " + data.users + " users. Uptime: " + data.uptime;
        }
        document.getElementById("awesomeloader").style.display = "none";
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