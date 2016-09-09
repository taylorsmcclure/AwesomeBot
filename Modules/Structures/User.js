const Cahce = require("./Cache.js");
const Role = require("./Role.js");
const Message = require("./Message.js");

// User object for extensions
module.exports = class User {
	constructor(bot, db, member, svr, serverDocument, isTesting, testingLog) {
		this.name = bot.getName(svr, serverDocument, member);
		this.username = member.user.username;
		this.discriminator = member.user.discriminator;
		this.nick = member.nickname;
		this.id = member.id;
		this.bot = member.user.bot;
		this.mention = member.toString();
		this.avatar = member.user.avatarURL;
		this.joined = member.joinDate;
		this.created = member.user.creationDate;
		this.status = member.user.status;
		this.game = member.user.game;
		this.permissions = member.permissions;
		this.hasPermission = member.hasPermission;
		this.roles = new Cache();
		member.roles.forEach(role => {
			this.roles.push(new Role(bot, db, svr, serverDocument, role, isTesting, testingLog));
		});
		this.roles.sort((a, b) => {
			return a.position - b.position;
		});
		this.sendMessage = (content, options, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Sent message \"" + content + "\" to @" + member.user.username);
            } else {
                if(Array.isArray(content)) {
                    bot.sendArray(member, content, 0, options, callback);
                } else {
                    member.sendMessage(content).then((msg, err) => {
                    	if(typeof(callback)=="function") {
                    		callback(err, new Message(bot, db, msg, serverDocument, isTesting, testingLog));
                		}
                    });
                }
            }
		};
		this.sendFile = (attachment, fileName, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Sent file " + url + " to @" + member.user.username);
            } else {
                member.sendFile(attachment, fileName).then((msg, err) => {
                	if(typeof(callback)=="function") {
                		callback(err, new Message(bot, db, msg, serverDocument, isTesting, testingLog));
            		}
                });
            }
        };
        this.getUserData = callback => {
        	var memberDocument = serverDocument.members.id(member.id);
			callback(memberDocument ? memberDocument.toObject() : null);
        };
        if(!member.user.bot) {
	        this.setUserDataKey = (key, value, callback) => {
		        if(isTesting) {
		            testingLog.push("INFO: Saved {\"" + key + "\": " + value + "} to user data for \"" + member.user.username + "\"");
		        }
	        	var memberDocument = serverDocument.members.id(member.id);
	        	if(!memberDocument) {
					serverDocument.members.push({_id: member.id});
					memberDocument = serverDocument.members.id(member.id);
				}
				if(!memberDocument.profile_fields) {
					memberDocument.profile_fields = {};
				}
	            memberDocument.profile_fields[key] = value;
	            serverDocument.save(err => {
	            	callback(err, memberDocument);
	            });
	        };
	        this.deleteUserDataKey = (key, callback) => {
	        	if(isTesting) {
		            testingLog.push("INFO: Deleted key \"" + key + "\" from user data for \"" + member.user.username + "\"");
		        }
	        	var memberDocument = serverDocument.members.id(member.id);
	        	if(!memberDocument) {
					serverDocument.members.push({_id: member.id});
					memberDocument = serverDocument.members.id(member.id);
				}
				if(!memberDocument.profile_fields) {
					memberDocument.profile_fields = {};
				}
	            delete memberDocument.profile_fields[key];
	            serverDocument.save(err => {
	            	callback(err, memberDocument);
	            });
	        };
        }
        this.getGlobalUserData = callback => {
        	db.users.findOne({_id: member.id}, (err, userDocument) => {
        		callback(userDocument ? userDocument.toObject() : null);
        	});
        };
        if(!member.user.bot) {
	        this.setGlobalUserData = (key, value, callback) => {
	        	db.users.findOrCreate({_id: member.id}, (err, userDocument) => {
	        		if(!err && userDocument) {
		        		if(isTesting) {
		        			testingLog.push("INFO: Saved {\"" + key + "\": " + value + "} to global user data for \"" + member.user.username + "\"");
		        		}
		        		if(!userDocument.profile_fields) {
							userDocument.profile_fields = {};
						}
	        			userDocument.profile_fields[key] = value;
	        			userDocument.save(err => {
        					callback(err, userDocument);
	        			});
	        		} else {
	        			callback(err);
	        		}
	        	});
	        };
	        this.deleteGlobalUserData = (key, callback) => {
	        	db.users.findOrCreate({_id: member.id}, (err, userDocument) => {
	        		if(!err && userDocument) {
		        		if(isTesting) {
		        			testingLog.push("INFO: Deleted key \"" + key + "\" from global user data for \"" + member.user.username + "\"");
		        			callback(err, userDocument.toObject());
		        		}
		        		if(!userDocument.profile_fields) {
							userDocument.profile_fields = {};
						}
	        			delete userDocument.profile_fields[key];
	        			userDocument.save(err => {
        					callback(err, userDocument);
	        			});
	        		} else {
	        			callback(err);
	        		}
	        	});
        	};
    	}
    	this.addRole = (role, callback) => {
    		if(role instanceof Role) {
    			role = svr.roles.find("id", role.id);
    			if(!user) {
                    if(isTesting) {
	                    testingLog.push("ERROR: Invalid role ID \"" + role.id + "\" in call to addRole");
	                }
	                return;
                }
    		} else {
                testingLog.push("ERROR: Invalid role type in call to addRole");
                return;
            }
            var that = this;
            member.addRole(role).then((newMember, err) => {
            	that.roles = new Cache();
				newMember.roles.forEach(role => {
					that.roles.push(new Role(bot, db, svr, serverDocument, role, isTesting, testingLog));
				});
				that.roles.sort((a, b) => {
					return a.position - b.position;
				});
				that.permissions = newMember.permissions;
				that.hasPermission = newMember.hasPermission;
            	callback(err);
            });
    	};
    	this.removeRole = (role, callback) => {
    		if(role instanceof Role) {
    			role = svr.roles.find("id", role.id);
    			if(!user) {
                    if(isTesting) {
	                    testingLog.push("ERROR: Invalid role ID \"" + role.id + "\" in call to removeRole");
	                }
	                return;
                }
    		} else {
                testingLog.push("ERROR: Invalid role type in call to removeRole");
                return;
            }
            var that = this;
            member.removeRole(role).then((newMember, err) => {
            	that.roles = new Cache();
				newMember.roles.forEach(role => {
					that.roles.push(new Role(bot, db, svr, serverDocument, role, isTesting, testingLog));
				});
				that.roles.sort((a, b) => {
					return a.position - b.position;
				});
				that.permissions = newMember.permissions;
				that.hasPermission = newMember.hasPermission;
            	callback(err);
            });
    	};
    	this.setNickname = (nick, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set nickname of @" + member.user.username + " to \"" + nick + "\"");
            }
        	var that = this;
            member.setNickname(nick).then((newMember, err) => {
            	if(!err) {
            		that.nick = newMember.nickname;
            	}
            	if(typeof(callback)=="function") {
            		callback(err);
            	}
            });
        };
        if(!member.user.bot) {
	        this.addStrike = (reason, user, callback) => {
	        	if(!callback) {
	        		callback = user;
	        		user = new this.constructor(bot, db, bot.user, svr, serverDocument, isTesting, testingLog);
	        	}
	        	var creator = svr.members.find("id", user.id);
	        	if(user instanceof User && creator && bot.getUserBotAdmin(svr, serverDocument, creator)==3) {
		            if(isTesting) {
		                testingLog.push("INFO: Added strike for @" + member.user.username + " with reason \"" + reason + "\"");
		            }
	            	var memberDocument = serverDocument.members.id(member.id);
		        	if(!memberDocument) {
						serverDocument.members.push({_id: member.id});
						memberDocument = serverDocument.members.id(member.id);
					}
	                memberDocument.strikes.push({
	                	_id: creator.id,
	                	reason: reason
	                });
	                serverDocument.save(callback);
	        	} else if(isTesting) {
                    testingLog.push("ERROR: Invalid user ID \"" + user.id + "\" in call to addStrike");
                }
	        };
        }
        this.block = callback => {
            if(serverDocument.config.blocked.indexOf(member.id)==-1) {
                if(isTesting) {
                    testingLog.push("INFO: Blocked @" + member.user.username);
                }
                serverDocument.config.blocked.push(member.id);
                serverDocument.save(callback);
            } else if(isTesting) {
                testingLog.push("ERROR: Invalid call to block, @" + member.user.username + " is already blocked");
            }
        };
        this.kick = callback => {
            if(isTesting) {
                testingLog.push("INFO: Kicked @" + member.user.username);
            }
            member.kick().then((newMember, err) => {
            	callback(err);
        	});
        };
        this.ban = callback => {
            if(isTesting) {
                testingLog.push("INFO: Banned @" + member.user.username);
            }
            member.ban().then((newMember, err) => {
            	callback(err);
        	});
        };
	}
}
