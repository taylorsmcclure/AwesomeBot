const config = require("./../../Configuration/config.json");

// OAuth link to join new server(s)
module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
	msg.channel.sendMessage(config.oauth_link);
};