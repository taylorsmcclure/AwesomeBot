const config = require("./../../Configuration/config.json");
const secondsToString = require("../PrettySeconds.js");

// Check if the bot is alive and well
module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
	var info = "Pong! " + (msg.guild.member(bot.user).nickname || bot.user.username) + " v" + bot.version + " by **@BitQuote** and **@mistmurk** running for " + secondsToString(process.uptime()).slice(0, -1) + ". Serving " + bot.users.size + " user" + (bot.users.size==1 ? "" : "s") + " in " + bot.guilds.size + " server" + (bot.guilds.size==1 ? "" : "s");
    if(config.hosting_url) {
        info += ". Info: " + config.hosting_url;
    }
    msg.channel.sendMessage(info);
};