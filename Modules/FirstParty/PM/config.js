const config = require("./../../../Configuration/config.json");

// Links to online dashboard
module.exports = (bot, db, winston, userDocument, msg, suffix) => {
	// Maintainer console for overall bot things
    if(config.maintainers.indexOf(msg.author.id)>-1 && !suffix) {
        if(config.hosting_url) {
            msg.channel.sendMessage(":globe_with_meridians: " + config.hosting_url + "dashboard/overview?svrid=maintainer");
        } else {
            msg.channel.sendMessage("**Limited mode:** You have not provided a hosting URL in the bot config, so the maintainer console is not available.");
        }
    }

    // Admin console, check to make sure the config command was valid
    if(suffix) {
        var svr = bot.serverSearch(suffix, msg.author, userDocument);
        // Check if specified server exists
        if(!svr) {
            msg.channel.sendMessage("Sorry, invalid server. :slight_frown: Try again?");
        // Check if sender is an admin of the specified server
        } else {
        	// Get server data
			db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
				if(!err && serverDocument && serverDocument.config.blocked.indexOf(msg.author.id)==-1) {
					if(bot.getUserBotAdmin(svr, serverDocument, msg.member)==3) {
						msg.channel.sendMessage(":globe_with_meridians: " + config.hosting_url + "dashboard/overview?svrid=" + svr.id);
					} else {
						msg.channel.sendMessage("You are not an admin for that server.");
					}
				} else {
					msg.channel.sendMessage("Sorry, invalid server. :slight_frown: Try again?");
				}
			});
		}
    }
};