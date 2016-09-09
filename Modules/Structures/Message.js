const Cache = require("./Cache.js");
const Channel = require("./Channel.js");
const User = require("./User.js");
const Role = require("./Role.js");

// Message object for extensions
module.exports = class Message {
	constructor(bot, db, msg, serverDocument, isTesting, testingLog) {
        this.content = msg.content;
        this.cleanContent = msg.cleanContent;
        this.id = msg.id;
        this.mentions = {
            users: new Cache(),
            roles: new Cache(),
            channels: new Cache(),
            everyone: msg.mentions.everyone
        };
        var mentionedUsers = msg.mentions.users.array();
        for(var i=0; i<mentionedUsers.length; i++) {
            if(mentionedUsers[i].id!=bot.user.id) {
                this.mentions.users.push(new User(bot, db, msg.guild.member(mentionedUsers[i]), msg.guild, serverDocument, isTesting, testingLog));
            }
        }
        var mentionedRoles = msg.mentions.roles.array();
        for(var i=0; i<mentionedRoles.length; i++) {
            this.mentions.roles.push(new Role(bot, db, msg.guild, serverDocument, mentionedRoles[i], isTesting, testingLog));
        }
        var mentionedChannels = msg.mentions.channels.array();
        for(var i=0; i<mentionedChannels.length; i++) {
            this.mentions.channels.push(new Channel(bot, db, mentionedChannels[i], serverDocument, isTesting, testingLog));
        }
        this.timestamp = msg.timestamp;
        this.edited = msg.editedTimestamp;
        this.author = new User(bot, db, msg.member, msg.guild, serverDocument, isTesting, testingLog),
        this.channel = new Channel(bot, db, msg.channel, serverDocument, isTesting, testingLog);
        this.attachments = msg.attachments.array();
        this.tts = msg.tts;
        this.pinned = msg.pinned;
        this.pin = callback => {
            if(isTesting) {
                testingLog.push("INFO: Pinned message \"" + msg.cleanContent + "\"");
            }
        	var that = this;
            msg.pin().then(err => {
            	if(!err) {
            		that.pinned = true;
            	}
            	if(typeof(callback)=="function") {
            		callback(err);
            	}
            });
        };
        this.unpin = callback => {
        	if(isTesting) {
                testingLog.push("INFO: Unpinned message \"" + msg.cleanContent + "\"");
            }
            msg.unpin().then(err => {
            	if(!err) {
            		that.pinned = false;
            	}
            	if(typeof(callback)=="function") {
            		callback(err);
            	}
            });
        };
        this.delete = callback => {
            if(testing) {
                testingLog.push("INFO: Deleted message \"" + msg.cleanContent + "\"");
            }
            msg.delete().then(callback);
        };
	}
}