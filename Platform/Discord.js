const config = require("./../Configuration/config.json");
const Message = require("./../Modules/Structures/Message.js");

const removeMd = require("remove-markdown");

module.exports = db => {
	// Create a new Discord.JS bot client
	const discord = require("discord.js");
	var client = new discord.Client({
		fetch_all_members: true		// get all users, including offline/inactive ones\
	});

	// AwesomeBot version
	client.version = config.version;

	// AwesomeBot join link
	client.oauth_link = config.oauth_link;

	// AwesomeBot server invite link
	client.discord_link = config.discord_link;

	// PM commands list
	client.pm_commands = config.pm_commands;

	// First-party public commands list
	client.commands = config.commands;

	// Commands to which the NSFW filter applies
	client.filtered_commands = config.filtered_commands;

	// Ways to +1 a member
	client.voteTriggers = config.vote_triggers;

	// Sequentially send an array
	client.sendArray = (ch, arr, i, options, callback) => {
	    if(i>=arr.length) {
	        callback();
	    }
	    ch.sendMessage(arr[i], options).then(msg => {
	        client.sendArray(ch, arr, ++i, callback);
	    });
    };

	// Get the command prefix for a server
	client.getCommandPrefix = (svr, serverDocument) => {
		return serverDocument.config.command_prefix=="@mention" ? ("@" + (svr.member(client.user).nickname || client.user.username) + " ") : serverDocument.config.command_prefix;
	};
	
	// Checks if message contains a command tag, returning the command and post-text
	client.checkCommandTag = (message, serverDocument) => {
		if(serverDocument.config.command_prefix=="@mention" && message.indexOf(client.user)==0) {
			var cmdstr = message.substring(client.user.length+1);
		} else if(serverDocument.config.command_prefix=="@mention" && message.indexOf("<@!" + client.user.id + ">")==0) {
        	var cmdstr = message.substring(("<@!" + client.user.id + ">").length+1);
		} else if(message.indexOf(serverDocument.config.command_prefix)==0) {
			var cmdstr = message.substring(serverDocument.config.command_prefix.length);
		} else {
			return;
		}
	    if(cmdstr.indexOf(" ")==-1) {
        	return {
        		command: cmdstr.toLowerCase(),
        		suffix: ""
    		};
    	} else {
        	return {
        		command: cmdstr.substring(0, cmdstr.indexOf(" ")).toLowerCase(), 
        		suffix: cmdstr.substring(cmdstr.indexOf(" ")+1)
    		};
    	}
	};

	// Gets the name of a user on a server in accordance with config
	client.getName = (svr, serverDocument, member, ignoreNick) => {
		return (((serverDocument.config.name_display.use_nick && !ignoreNick) ? (member.nickname || member.user.username) : member.user.username) + (serverDocument.config.name_display.show_discriminator ? ("#" + member.user.discriminator) : "")).clean();
	};

	// Finds a user on a server (by username, ID, etc.)
	client.memberSearch = (str, svr) => {
		var member;
	    str = str.trim();
	    if(str.indexOf("<@!")==0) {
	        member = svr.members.find("id", str.substring(3, str.length-1));
	    } else if(str.indexOf("<@")==0) {
	        member = svr.members.find("id", str.substring(2, str.length-1));
	    } else if(!isNaN(str)) {
	        member = svr.members.find("id", str);
	    } else {
	        if(str.indexOf("@")==0) {
	            str = str.slice(1);
	        }
	        if(str.lastIndexOf("#")==str.length-5 && !isNaN(str.substring(str.lastIndexOf("#")+1))) {
	            member = svr.members.findAll("username", str.substring(0, str.lastIndexOf("#"))).find("discriminator", str.substring(str.lastIndexOf("#")+1));
	        } else {
	            member = svr.members.find("username", str);
	        }
	        if(!member) {
	        	var members = svr.members.array();
	            for(var i=0; i<members.length; i++) {
	                if(members[i].nickname && members[i].nickname==str) {
	                    member = members[i];
	                    break;
	                }
	            }
	        }
	    }
	    return member;
	};

	// Finds a server (by name, ID, etc.)
	client.serverSearch = (str, usr, userDocument) => {
	    function checkServer(svr) {
		    return svr && svr.members.exists("id", usr.id);
		}

		var svr = client.guilds.find("name", str);
        if(checkServer(svr)) {
            return svr;
        }

        svr = client.guilds.find("id", str);
        if(checkServer(svr)) {
            return svr;
        }

        var servers = client.guilds.array();
        for(var i=0; i<servers.length; i++) {
            if(str.toLowerCase()==servers[i].name.toLowerCase() && checkServer(servers[i])) {
                return servers[i];
            }
        }

        var svrnick = userDocument.server_nicks.id(str.toLowerCase());
        if(svrnick) {
            svr = client.guilds.find("id", svrnick.server_id);
            if(checkServer(svr)) {
                return svr;
            }
        }
        return;
	};

	// Gets the game a user is playing
	client.getGame = usr => {
		if(typeof(usr.game)=="string") {
			return usr.game;
		} else if(usr.game && usr.game.name) {
			return usr.game.name;
		}
		return "";
	};

	// Check if a user has leveled up a rank
	client.checkRank = (winston, svr, serverDocument, member, memberDocument, override) => {
		if(member && member.id!=client.user.id && !member.user.bot && svr) {
	        var currentRankscore = memberDocument.rank_score + (override ? 0 : ((memberDocument.messages + (memberDocument.voice * 10)) / 10));
	        for(var i=0; i<serverDocument.config.ranks_list.length; i++) {
	            if(currentRankscore<=serverDocument.config.ranks_list[i].max_score || i==serverDocument.config.ranks_list.length-1) {
	                if(memberDocument.rank!=serverDocument.config.ranks_list[i]._id && !override) {
	                    memberDocument.rank = serverDocument.config.ranks_list[i]._id;
	                    if(serverDocument.config.ranks_list) {
	                        if(serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.status_messages.member_rank_updated_message.isEnabled) {
	                        	// Send member_rank_updated_message if necessary
	                            if(serverDocument.config.moderation.status_messages.member_rank_updated_message.type=="message") {
	                            	var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_rank_updated_message.channel_id);
	                            	if(ch) {
	                            		var channelDocument = serverDocument.channels.id(ch.id);
										if(!channelDocument || channelDocument.bot_enabled) {
											ch.sendMessage("Congratulations " + member + ", you've leveled up to **" + memberDocument.rank + "** :trophy:");
										}
	                            	}
	                            } else if(serverDocument.config.moderation.status_messages.member_rank_updated_message.type=="pm") {
	                                member.sendMessage("Congratulations, you've leveled up to **" + memberDocument.rank + "** on " + svr.name + " :trophy:");
	                            }
	                        }

	                        // Add 100 AwesomePoints as reward
	                        if(serverDocument.config.commands.points.isEnabled && svr.members.length>2) {
	                        	db.users.findOrCreate({_id: member.id}, (err, userDocument) => {
									if(!err && userDocument) {
										userDocument.points += 100;
										userDocument.save(err => {
											if(err) {
												winston.error("Failed to save user data for points", {usrid: member.id}, err);
											}
										});
									} else {
										winston.error("Failed to find or create user data for points", {usrid: member.id}, err);
									}
								});
	                        }

	                        // Assign new rank role if necessary
	                        if(serverDocument.config.ranks_list[i].role_id) {
	                        	var role = svr.roles.find("id", serverDocument.config.ranks_list[i].role_id);
	                            member.addRole(role).then().catch(err => {
                                	winston.error("Failed to add member '" + member.user.username + " to role '" + role.name + "' on server '" + svr.name + "' for rank level up", {svrid: svr.id, usrid: member.id, roleid: role.id}, err);
	                            });
	                        }
	                    }
	                }
	                return serverDocument.config.ranks_list[i]._id;
	            }
	        }
	    }
	    return "";
	};

	// Handle a spam or filter violation on a server
	client.handleViolation = (winston, svr, serverDocument, ch, member, userDocument, memberDocument, userMessage, adminMessage, strikeMessage, action, roleid) => {
		// Deduct 50 AwesomePoints if necessary
		if(serverDocument.config.commands.points.isEnabled) {
			userDocument.points -= 50;
			userDocument.save(err => {
				winston.error("Failed to save user data for points", {usrid: member.id}, err);
			});
		}

		// Add a second strike for user
		memberDocument.strikes.push({
			_id: client.user.id,
			reason: strikeMessage
		});

		// Assign role if necessary
		if(roleid) {
			var role = svr.roles.find("id", roleid);
			if(role) {
				member.addRole(role).then().catch(err => {
					winston.error("Failed to add member '" + member.user.username + "'' to role '" + role.name + "'' on server '" + svr.name + "'", {svrid: svr.id, usrid: member.id, roleid: role.id}, err);
				});
			}
		}

		// Perform action, message admins, and message user
		switch(action) {
			case "block":
				if(serverDocument.config.blocked.indexOf(member.id)==-1) {
					serverDocument.config.blocked.push(member.id);
				}
				member.sendMessage(userMessage + ", so I blocked you from using me on the server. Contact a moderator to resolve this.");
				client.messageBotAdmins(svr, serverDocument, adminMessage + ", so I blocked them from using me on the server.");
				break;
			case "mute":
				client.muteMember(ch, member).then(() => {
					member.sendMessage(userMessage + ", so I muted you in the channel. Contact a moderator to resolve this.");
					client.messageBotAdmins(svr, serverDocument, adminMessage + ", so I muted them in the channel.");
				}).catch(err => {
					client.handleViolation(winston, svr, serverDocument, ch, member, userDocument, memberDocument, userMessage, adminMessage, strikeMessage, "block", roleid);
				});
				break;
			case "kick":
				member.kick().then(() => {
					member.sendMessage(userMessage + ", so I kicked you from the server. Goodbye.");
					client.messageBotAdmins(svr, serverDocument, adminMessage + ", so I kicked them from the server.");
				}).catch(err => {
					client.handleViolation(winston, svr, serverDocument, ch, member, userDocument, memberDocument, userMessage, adminMessage, strikeMessage, "block", roleid);
				});
				break;
			case "ban":
				member.ban().then(() => {
					member.sendMessage(userMessage + ", so I banned you from the server. Goodbye.");
					client.messageBotAdmins(svr, serverDocument, adminMessage + ", so I banned them from the server.");
				}).catch(err => {
					client.handleViolation(winston, svr, serverDocument, ch, member, userDocument, memberDocument, userMessage, adminMessage, strikeMessage, "block", roleid);
				});
				break;
			default:
				member.sendMessage(userMessage + ", and the chat moderators have again been notified about this.");
				client.messageBotAdmins(svr, serverDocument, adminMessage + ", but I didn't do anything about it.");
		}
	};

	// Check if user has a bot admin role on a server
	client.getUserBotAdmin = (svr, serverDocument, member) => {
		if(svr.owner.id==member.id) {
			return 3;
		}
		var adminLevel = 0;
		var roleIDsOfMember = Array.from(member.roles.keys());
		for(var i=0; i<roleIDsOfMember.length; i++) {
			var adminDocument = serverDocument.config.admins.id(roleIDsOfMember[i]);
			if(adminDocument && adminDocument.level>adminLevel) {
				adminLevel = adminDocument.level;
			}
			if(adminLevel==3) {
				break;
			}
		}
		return adminLevel;
	};

	// Message the bot admins for a server
	client.messageBotAdmins = (svr, serverDocument, message) => {
		svr.members.forEach(member => {
			if(client.getUserBotAdmin(svr, serverDocument, member)>=2 && member.id!=bot.user.id && !member.user.bot) {
				member.sendMessage(message);
			}
		});
	};

	// Check if a user is muted on a server
	client.isMuted = (ch, member) => {
		return !ch.permissionsFor(member).hasPermission("SEND_MESSAGES");
	};

	// Mute a member of a server in a channel
	client.muteMember = (ch, member, callback) => {
		if(!client.isMuted(ch, member) && ch.type=="text") {
			ch.overwritePermissions(member, {
				"SEND_MESSAGES": false
			}).then(callback);
		}
	};

	// Unmute a member of a server in a channel
	client.unmuteMember = (ch, member, callback) => {
		if(client.isMuted(ch, member) && ch.type=="text") {
			ch.overwritePermissions(member, {
				"SEND_MESSAGES": true
			}).then(callback);
		}
	};

	// Fetches messages in a channel
 	client.getMessages = (ch, serverDocument, num, callback, isForExtension, testingExtensionLog) => {
 	    var archive = [];
 		function doArchive(count, lastId) {
 		    ch.fetchMessages(ch, {
 		    	limit: count,
 		    	before: lastId
 		    }).then(messages => {
            	messages.every(msg => {
	                if(!msg.system && archive.length<num) {
		                if(isForExtension) {
	                    	archive.push(new Message(client, db, msg, serverDocument, testingExtensionLog!=null, testingExtensionLog));
		                } else {
							archive.push({
								timestamp: msg.timestamp,
								id: msg.id,
								edited: msg.editedTimestamp,
								pinned: msg.pinned,
								content: msg.content,
								clean_content: msg.cleanContent,
								attachments: msg.attachments,
	                            author: {
	                                username: msg.author.username,
	                                id: msg.author.id,
	                                discriminator: msg.author.username,
	                                bot: msg.author.bot,
	                                avatar: msg.author.avatar
	                            }
							});
						}
						return true;
					}
					return false;
            	});
				if(archive.length>=num || messages.length<count) {
					callback(null, archive);
				} else {
					var nextCount = num - archive.length;
					doArchive(nextCount>100 ? 100 : nextCount, archive[archive.length-1].id);
 		        }
 		    }).catch(callback);
 		};
 		doArchive(num>100 ? 100 : num, ch.lastMessageId);
 	};

 	// Deletes messages in a channel (can filter by user)
 	client.deleteMessages = (serverDocument, ch, channelDocument, conditions, num, callback) => {
 		if(!callback) {
 			callback = num;
 			num = conditions;
 			conditions = {};
 		}
 		if(num>1000000) {
 			callback(new Error(num + " exceeds mass message deletion limit"));
 		}
 		channelDocument.isMessageDeletedDisabled = true;
        serverDocument.save();

        // Checks if a message can be deleted
        function canDelete(msg) {
        	// User condition(s)
        	if(conditions.user) {
        		if((conditions.user.indexOf(msg.author.id)>-1 && !conditions.userExclude) || (conditions.user.indexOf(msg.author.id)==-1 && conditions.userExclude)) {
        			return true;
        		}
        	}
        	// Role condition(s)
        	if(conditions.role) {
        		var result = true;
    			for(var i=0; i<conditions.role.length; i++) {
    				var role = ch.guild.roles.find("id", conditions.role[i]);
    				if(role) {
    					var hasRole = msg.author.roles.exists("id", role.id);
    					if((hasRole && !conditions.roleExclude) || (!hasRole && conditions.roleExclude)) {
    						result = true;
    					}
    				}
    			}
    			if(result) {
    				return true;
    			}
        	}
        	// Word conditions
        	if(conditions.content) {
        		var result = true;
    			for(var i=0; i<conditions.content.length; i++) {
					if(conditions.contentCaseSensitive) {
						if((msg.content.indexOf(conditions.content[i])>-1 && !conditions.contentExclude) || (msg.content.indexOf(conditions.content[i])==-1 && conditions.contentExclude)) {
							result = true;
						}
					} else {
						if((msg.content.toLowerCase().indexOf(conditions.content[i].toLowerCase())>-1 && !conditions.contentExclude) || (msg.content.toLowerCase().indexOf(conditions.content[i].toLowerCase())==-1 && conditions.contentExclude)) {
							result = true;
						}
					}
    			}
    			if(result) {
    				return true;
    			}
        	}
        	return false;
        };

    	// Cleans messages
 		function doNuke(options) {
	        ch.fetchMessages(options).then(messages => {
	        	messages = messages.array();

	        	var toDelete = [];
                for(var i=0; i<messages.length; i++) {
                    if(canDelete(messages[i]) && !messages[i].pinned) {
                        toDelete.push(messages[i]);
                        num--;
                    }
                    if(num==0) {
                        break;
                    }
                }

                function next(err) {
                	if(err || num==0) {
                        channelDocument.isMessageDeletedDisabled = false;
            			serverDocument.save();
                        callback(err);
                    } else {
                        doNuke({
                        	limit: 100,
                        	before: messages[messages.length-1].id
                        });
                    }
                }

                if(toDelete.length>1) {
                    ch.bulkDelete(toDelete).then(next);
                } else {
                	toDelete[0].delete().then(next);
                }
            }).catch(err => {
                channelDocument.isMessageDeletedDisabled = false;
                serverDocument.save();
                callback(err);
	        });
	    };
	    doNuke({limit: 100});
 	}

	return client;
}

// Cleans a string (strip markdown, prevent @everyone or @here)
String.prototype.clean = () => {
	var str = removeMd(this).replaceAll("_", "\\_").replaceAll("*", "\\*").replaceAll("`", "\\`");
	return ((str.indexOf("everyone")==0 || str.indexOf("here")==0) ? ("\u200b" + str) : str).replaceAll("@everyone", "@\u200beveryone").replaceAll("@here", "@\u200bhere").replaceAll("<@", "<@\u200b");
};

String.prototype.replaceAll = (target, replacement) => {
    return this.split(target).join(replacement);
};