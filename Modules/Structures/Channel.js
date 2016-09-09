const Message = require("./Message.js");
const Role = require("./Role.js");
const User = require("./User.js");
const Invite = require("./Invite.js");

// newChannel object for extensions
module.exports = class newChannel {
	constructor(bot, db, ch, serverDocument, isTesting, testingLog) {
		this.name = ch.name;
        this.id = ch.id;
        this.created = ch.creationDate;
        this.mention = ch.toString();
        this.position = ch.position;
        this.topic = ch.topic;
        var newChannelDocument = serverDocument.newChannels.id(ch.id);
        this.data = newChannelDocument ? newChannelDocument.toObject() : null;
        this.startTyping = (count, callback) => {
    		ch.startTyping(count).then(callback);
        };
        this.stopTyping = (force, callback) => {
        	ch.stopTyping(force).then(callback);
        };
        this.sendMessage = (content, options, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Sent message \"" + content + "\" in #" + ch.name);
            } else {
                if(Array.isArray(content)) {
                    bot.sendArray(ch, content, 0, options, callback);
                } else {
                    ch.sendMessage(content, options).then((msg, err) => {
                    	if(typeof(callback)=="function") {
                    		callback(err, new Message(bot, db, msg, serverDocument, isTesting, testingLog));
                		}
                    });
                }
            }
        };
        this.sendFile = (attachment, fileName, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Sent file " + attachment + " in #" + ch.name);
            } else {
                ch.sendFile(attachment, fileName).then((msg, err) => {
                	if(typeof(callback)=="function") {
                		callback(err, new Message(bot, db, msg, serverDocument, isTesting, testingLog));
            		}
                });
            }
        };
        this.getMessages = (num, callback) => {
            bot.getMessages(ch, serverDocument, num, callback, true, testingLog);
        };
        this.deleteMessages = (conditions, num, callback) => {
        	if(!callback) {
        		callback = num;
                num = conditions;
        		conditions = {};
        	}

            if(isTesting) {
                testingLog.push("INFO: Deleted " + num + " messages" + (conditions ? (" with conditions " + JSON.stringify(conditions)) : "") + " in #" + ch.name);
            }
        	if(!newChannelDocument) {
				serverDocument.newChannels.push({_id: ch.id});
				newChannelDocument = serverDocument.newChannels.id(ch.id);
				serverDocument.save();
			}
            bot.deleteMessages(serverDocument, ch, newChannelDocument, conditions, num, callback);
        };
        this.permissionsOf = user => {
            if(user instanceof User) {
                user = ch.guild.members.find("id", user.id);
                if(!user) {
                    if(isTesting) {
	                    testingLog.push("ERROR: Invalid user ID \"" + user.id + "\" in call to permissionsOf");
	                }
	                return;
                }
            } else {
                testingLog.push("ERROR: Invalid user type in call to permissionsOf");
                return;
            }
            return ch.permissionsFor(user);
        };
        this.overwritePermissions = (type, obj, options, callback) => {
            if(typeof(callback)!="function") {
                if(type) {
                    testingLog.push("ERROR: Invalid callback type in call to overwritePermissions");
                }
                return;
            }
            if(type=="user" && obj instanceof User) {
                var member = ch.guild.members.find("id", obj.id);
                if(member) {
                    if(isTesting) {
                        testingLog.push("INFO: Changed permissions for @" + member.user.username + " in #" + ch.name + " to " + JSON.stringify(options));
                    }
                    ch.overwritePermissions(member, options).then(callback);
                } else if(isTesting) {
                    testingLog.push("ERROR: Invalid user ID \"" + obj.id + "\" in call to overwritePermissions");
                }
            } else if(type=="role" && obj instanceof Role) {
                var role = ch.guild.roles.find("id", obj.id);
                if(role) {
                    if(isTesting) {
                        testingLog.push("INFO: Changed permissions for role " + role.name + " in #" + ch.name + " to " + JSON.stringify(options));
                    }
                    ch.overwritePermissions(role, options).then(callback);
                } else if(isTesting) {
                    testingLog.push("INFO: Invalid role ID \"" + id + "\" in call to overwritePermissions");
                }
            } else {
                testingLog.push("ERROR: Invalid type \"" + type + "\" or user/role in call to overwritePermissions");
            }
        };
        this.isUserMuted = user => {
            var member = ch.guild.members.find("id", user.id);
            if(user instanceof User && member) {
                return bot.isMuted(ch, member);
            } else {
                if(isTesting) {
                    testingLog.push("ERROR: Invalid user ID \"" + user.id + "\" in call to isUserMuted");
                }
            }
        };
        this.muteMember = (user, callback) => {
            var member = ch.server.members.find("id", user.id);
            if(user instanceof User && member) {
                bot.muteMember(ch, member, callback);
            } else if(isTesting) {
                testingLog.push("ERROR: Invalid user ID \"" + user.id + "\" in call to muteMember");
            }
        };
        this.unmuteMember = (user, callback) => {
            var member = ch.server.members.find("id", user.id);
            if(user instanceof User && member) {
                bot.unmuteMember(ch, member, callback);
            } else if(isTesting) {
                testingLog.push("ERROR: Invalid user ID \"" + user.id + "\" in call to unmuteMember");
            }
        };
        this.awaitMessages = (filter, options, callback) => {
            ch.awaitMessages(message => {
                return filter(new Message(bot, db, msg, serverDocument, isTesting, testingLog));
            }, options).then(messages => {
                messages = messages.array();
                for(var i=0; i<messages.length; i++) {
                    messages[i] = new Message(bot, db, messages[i], serverDocument, isTesting, testingLog);
                }
                callback(messages);
            });
        };
        this.createInvite = (options, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Created invite to #" + ch.name + " with options " + JSON.stringify(options));
            }
            ch.createInvite(options).then(invite => {
                callback(null, new Invite(bot, db, invite, serverDocument, isTesting, testingLog));
            }).catch(callback);
        };
        this.setName = (name, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set name of #" + ch.name + " to \"" + name + "\"");
            }
        	var that = this;
            ch.setName(name).then((newChannel, err) => {
                if(!err) {
                    that.name = newChannel.name;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setPosition = (position, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set position of #" + ch.name + " to " + position);
            }
            var that = this;
            ch.setPosition(position).then((newChannel, err) => {
                if(!err) {
                    that.position = newChannel.position;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setTopic = (topic, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set topic of #" + ch.name + " to \"" + topic + "\"");
            }
        	var that = this;
            ch.setTopic(topic).then((newChannel, err) => {
                if(!err) {
                    that.topic = newChannel.topic;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.delete = callback => {
            if(isTesting) {
                testingLog.push("INFO: Deleted #" + ch.name);
            }
            ch.delete().then(callback);
        }
	}	
}