"use strict";
const User = require("./User.js");

// Bot object for extensions
module.exports = class Bot {
	constructor(bot, db, svr, serverDocument, isTesting, testingLog) {
		this.user = new User(bot, db, bot.user, svr, serverDocument, isTesting, testingLog);
		this.servers = bot.guilds.length;
		this.users = bot.users.length;
		this.uptime = process.uptime();
		this.connectionUptime = bot.uptime;
	}
}