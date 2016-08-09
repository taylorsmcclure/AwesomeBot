var auth = JSON.parse(localStorage.getItem("auth")) || {};
var data;
var type = "queue";

function getData(override) {
	NProgress.start();
	if(!override) {
		if(type=="list") {
			document.getElementById("ext-type-button").innerHTML = "Viewing Unapproved Submitted Items";
			type = "queue";
		} else {
			document.getElementById("ext-type-button").innerHTML = "Viewing Published Items";
			type = "list";
		}
	}
	getJSON("gallery?action=view&type=" + type, function(extlist) {
		var hash = false;
		if(!data) {
			hash = true;
		}
		data = extlist;
		writeData();
		if(hash) {
			checkHash();
		}
		NProgress.done();
	});	
}

function writeData() {
	var ext_container = "";
	for(var i=0; i<data.length; i++) {
		ext_container += "<div class='panel panel-default'><div class='panel-heading' role='tab' id='" + data[i].id + "-heading'><h4 class='panel-title'><a class='collapsed' role='button' data-toggle='collapse' href='#" + data[i].id + "-content' aria-expanded='false' aria-controls='" + data[i].id + "-content'>" + data[i].name + "</a>&nbsp;&nbsp;<span class='label label-default'>" + data[i].type.charAt(0).toUpperCase() + data[i].type.slice(1) + "</span>" + (data[i].featured ? "&nbsp;<span class='label label-primary'>Featured</span>" : "") + "</h4></div><div id='" + data[i].id + "-content' class='panel-collapse collapse' role='tabpanel' aria-labelledby='" + data[i].id + "-heading'><div class='panel-body'>" + micromarkdown.parse(data[i].description || "*No description*") + "<br><br><img style='float:left;width:120px;' src='" + data[i].author.avatar + "' /><div style='padding-left:140px;padding-top:15px;padding-bottom:15px;'>Created by <b>" + data[i].author.username + "</b><br>User ID: <code>" + data[i].author.id + "</code><br>Submitted on " + data[i].timestamp + "<br>ExtID: <code>" + data[i].id + "</code></div><br>" + ((type=="list" && auth.type=="admin") ? "<a href='javascript:add(" + i + ");' role='button' class='btn btn-primary'><span class='glyphicon glyphicon-plus' aria-hidden='true'></span> Add</a>&nbsp;" : "") + "<a href='javascript:getCode(" + i + ");' role='button' class='btn btn-default'><span class='glyphicon glyphicon-download-alt' aria-hidden='true'></span> Get Code</a>" + (auth.type=="maintainer" ? "&nbsp;<a href='javascript:getInfo(" + i + ");' role='button' class='btn btn-default'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span> Info</a>" : "") + ((type=="queue" && auth.type=="maintainer") ? "&nbsp;<a href='javascript:maintainer(" + i + ", \"approve\");' role='button' class='btn btn-success'><span class='glyphicon glyphicon-check' aria-hidden='true'></span> Approve</a>" : "") + ((type=="queue" && auth.type=="maintainer") ? "&nbsp;<a href='javascript:maintainer(" + i + ", \"reject\");' role='button' class='btn btn-danger'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span> Reject</a>" : "") + ((type=="list" && auth.type=="maintainer") ? "&nbsp;<a href='javascript:maintainer(" + i + ", \"feature\");' role='button' class='btn btn-info'><span class='glyphicon glyphicon-star" + (data[i].featured ? "-empty" : "") + "' aria-hidden='true'></span> " + (data[i].featured ? "Unfeature" : "Feature") + "</a>" : "") + ((type=="list" && auth.type=="maintainer") ? "&nbsp;<a href='javascript:maintainer(" + i + ", \"remove\");' role='button' class='btn btn-danger'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span> Remove</a>" : "") + "</div></div></div>";
	}
	if(!ext_container) {
		ext_container = "<i>Nothing here at the moment</i>";
	}
	document.getElementById("ext-container").innerHTML = ext_container;
}

function searchData(q) {
	if(q) {
		NProgress.start();
		getJSON("gallery?action=search&type=" + type + "&q=" + encodeURI(q), function(extlist) {
			data = extlist;
			writeData();
			NProgress.done();
		});	
	} else {
		getData(true);
	}
}

function add(i) {
	var extension = JSON.parse(JSON.stringify(data[i]));
	extension.channels = [];
	delete extension.description;
	delete extension.id;
	delete extension.score;
	delete extension.featured;
	delete extension.timestamp;
	delete extension.author;
	postJSON({
		extension: extension
	}, "extension?auth=" + auth.token + "&svrid=" + auth.svrid + "&type=final", function(response) {
		if(response.status==200 && JSON.parse(response.response).isValid) {
			window.location.href = "admin#extensions";
		} else {
			richModal("Something went wrong");
		}
	});
}

function getCode(i) {
	window.open("data:application/javascript;charset=utf-8," + escape(data[i].process.replaceAll("<!--AWESOME_EXTENSION_NEWLINE-->", "\n")));
}

function getInfo(i) {
	window.open("data:application/javascript;charset=utf-8," + escape(JSON.stringify(data[i], null, 2)));
}

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

function maintainer(i, action) {
	if(["reject", "remove"].indexOf(action)>-1) {
		var reason = prompt("Reason:");
		if(!reason) {
			return;
		}
	}
	postJSON(null, "gallery?action=" + action + "&auth=" + auth.token + "&id=" + data[i].id + (["reject", "remove"].indexOf(action)>-1 ? ("&reason=" + encodeURI(reason)) : ""), function(status) {
		if(status==200) {
			getData(true);
		} else {
			richModal("Something went wrong");
		}
	});
}

function postJSON(data, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("post", url, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    if(data) {
    	xhr.send(JSON.stringify(data));
    } else {
    	xhr.send();
	}
    xhr.onloadend = function() {
    	if(data) {
    		callback(xhr);
    	} else {
        	callback(xhr.status);
    	}
    };
}

function checkHash() {
	if(window.location.hash) {
		$(window.location.hash + "-content").collapse("show");
	}
}