const Channel = require("./Channel.js");
const User = require("./User.js");

// Invite object for extensions
module.exports = class Invite {
	constructor(bot, db, invite, serverDocument, isTesting, testingLog) {
		this.code = invite.code;
		this.channel = new Channel(bot, db, invite.channel, serverDocument, isTesting, testingLog);
		this.creator = new User(bot, db, invite.inviter, invite.guild, serverDocument, isTesting, testingLog);
		this.created = invite.creationDate;
		this.maxAge = invite.maxAge;
		this.uses = invite.uses;
		this.maxUses = invite.maxUses;
		this.temporary = invite.temporary;
		this.delete = callback => {
			if(isTesting) {
				testingLog.push("INFO: Deleted invite " + invite.code + " to #" + this.channel.name);
			}
			invite.delete().then(callback);
		};
	}
};