function doMaintainerSetup() {
    document.title = botData.username + " Maintainer Console";
    document.getElementById("botname").innerHTML = botData.username;
    document.getElementById("profilepic").src = botData.avatar;
    configGame(true);
    
    switchUsage();
    switchServers();
    switchBotBlocked();
    
    destroyLoader();
}

function configStatus(statstr) {
    document.getElementById("statusswitcher").value = statstr;
    config("status", statstr, function() {
        document.getElementById("statusswitcher").value = botData.status;
    });
}

function switchUsage() {
    document.getElementById("commandusage").style.opacity = 0;
    document.getElementById("commandusage").style.height = 0;
    showLoader();
    
    document.getElementById("commandusage").innerHTML = "";
    if(botData.commandusage.length>0) {
        for(var i=botData.commandusage.length-1; i>=0; i--) {
            document.getElementById("commandusage").innerHTML += botData.commandusage[i] + "<br>";
        }
        document.getElementById("commandusage").innerHTML += "<i>Data since " + botData.statsage + "</i>";
    } else {
        document.getElementById("commandusage").innerHTML += "<i>Nothing here</i><br>";
    }
    
    document.getElementById("commandusage").style.height = ((document.getElementById("commandusage").innerHTML.match(/<br>/ig) ? document.getElementById("commandusage").innerHTML.match(/<br>/ig).length : 1) + 1) * 18;
    document.getElementById("commandusage").style.opacity = 1;
    setTimeout(function() {
        destroyLoader();
    }, 250);
}

function switchServers() {
    var servertablebody = "";
    for(var i=0; i<botData.servers.length; i++) {
        servertablebody += "<tr id=\"serverentry-" + botData.servers[i][2] + "\"><td><img class=\"profilepic\" width=25 src=\"" + botData.servers[i][0] + "\" /></td><td>" + botData.servers[i][1] + "</td><td>" + botData.servers[i][2] + "</td><td>" + botData.servers[i][3] + "</td><td><span class=\"removetool\" onclick=\"javascript:removeServer(this.parentNode.parentNode.id)\"><i>(remove)</i></span>&nbsp;<span class=\"removetool\" onclick=\"javascript:config('clearstats', this.parentNode.parentNode.id.substring(12), function(err) {if(!err) {switchUsage()}});\"><i>(clear stats)</i></span></td></tr>";
    }
    document.getElementById("servertablebody").innerHTML = servertablebody;
    document.getElementById("addserverlink").href = botData.oauthurl;
}

function removeServer(svrid) {
    if(botData.servers.length==1) {
        alert("Cannot remove only server");
    } else {
        config("rmserver", svrid.substring(12), function(err) {
            if(!err) {
                document.getElementById(svrid).parentNode.removeChild(document.getElementById(svrid));
            }
        });
    }
}

function switchBotBlocked() {
    document.getElementById("botblockedtable").style.display = "";
    
    var blacklist = [];
    var botblockedtablebody = "";
    for(var i=0; i<botData.botblocked.length; i++) {
        blacklist.push(botData.botblocked[i][2]);
        botblockedtablebody += "<tr id=\"botblockedentry-" + botData.botblocked[i][2] + "\"><td><img class=\"profilepic\" width=25 src=\"" + botData.botblocked[i][0] + "\" /></td><td>" + botData.botblocked[i][1] + "</td><td>" + botData.botblocked[i][2] + "</td><td><span class=\"removetool\" onclick=\"javascript:config('botblocked', this.parentNode.parentNode.id.substring(16), switchBotBlocked);\"><i>(remove)</i></span></td></tr>";
    }
    document.getElementById("botblockedtablebody").innerHTML = botblockedtablebody;
    if(botData.botblocked.length==0) {
        document.getElementById("botblockedtable").style.display = "none";
    }
    
    filterMembers(blacklist, function(possibleBotBlocked) {
        var botblockedselector = "<option value=\"\">Select User</option>";
        for(var i=0; i<possibleBotBlocked.data.length; i++) {
            botblockedselector += "<option value=\"" + possibleBotBlocked.data[i][1] + "\">" + possibleBotBlocked.data[i][0] + "</option>";
        }
        document.getElementById("botblockedselector").innerHTML = botblockedselector;
    });
}

function configUsername() {
    if(!document.getElementById("botnameinput")) {
        document.getElementById("botname").innerHTML = "<input id=\"botnameinput\" onkeydown=\"if(event.keyCode==13){config('username', this.value, configUsername)}else if(event.keyCode==27){configUsername()}\" value=\"" + document.getElementById("botname").innerHTML + "\"></input>";
        document.getElementById("botname").onclick = "";
        document.getElementById("botnameinput").focus();
    } else {
        showLoader();
        document.getElementById("botname").innerHTML = botData.username;
        document.getElementById("botname").onclick = configUsername;
        destroyLoader();
    }
}

function configGame(remove) {
    if(!document.getElementById("botgameinput") && !remove) {
        document.getElementById("botgame").innerHTML = "<input id=\"botgameinput\" onkeydown=\"if(event.keyCode==13){config('game', this.value, configGame)}else if(event.keyCode==27){configGame()}\" value=\"" + (botData.game || "") + "\"></input>";
        document.getElementById("botgame").onclick = "";
        document.getElementById("botgameinput").focus();
    } else {
        document.getElementById("botgame").innerHTML = botData.game ? ("<b>Playing</b> " + botData.game) : "<i>Not playing a game</i>";
        document.getElementById("botgame").onclick = configGame;
        if(botData.game) {
            document.getElementById("botgameremove").innerHTML = "&nbsp<i>(remove)</i>";
        } else {
            document.getElementById("botgameremove").innerHTML = "";
        }
        if(botData.defaultgame) {
            document.getElementById("botgamedefault").innerHTML = "";
        } else {
            document.getElementById("botgamedefault").innerHTML = "&nbsp<i>(default)</i>";
        }
    }
}

function configAvatar() {
    var u = prompt("Enter the new URL for " + botData.username + "'s avatar");
    if(u) {
        postJSON({avatar: u}, function(err) {
            if(!err) {
                location.reload();
            }
        });
    }
}