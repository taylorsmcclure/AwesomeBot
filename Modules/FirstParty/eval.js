const config = require("./../../Configuration/config.json");

// Run eval on maintainer message
module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
	if(config.maintainers.indexOf(msg.author.id)>-1) {
		if(suffix) {
            try {
                msg.channel.sendMessage("```" + eval(suffix) + "```");
            } catch(err) {
                msg.channel.sendMessage("```" + err + "```");
            }
        }
    } else {
        msg.channel.sendMessage(msg.author + " Who do you think you are?! LOL");
    }
};