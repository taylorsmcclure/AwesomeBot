// User status changed (afk, new game, etc.)
module.exports = (bot, db, winston, oldusr, newusr) => {
	if(oldusr.id!=bot.user.id && !oldusr.bot && !newusr.bot) {
		// Do this for each server the user is on
		function doPresence(svr) {
			db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
				if(!err && serverDocument) {
					if(serverDocument.config.moderation.isEnabled) {
						var newmember = svr.member(newusr);
						// Send member_online_message if necessary
						if(oldusr.status=="offline" && newusr.status=="online" && serverDocument.config.moderation.status_messages.member_online_message.isEnabled) {
							winston.info("Member '" + newusr.username + "' came online", {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_online_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage(serverDocument.config.moderation.status_messages.member_online_message.messages[getRandomInt(0, serverDocument.config.moderation.status_messages.member_online_message.messages.length-1)].replaceAll("@user", "**@" + bot.getName(bot.guilds[i], serverDocument, newmember) + "**"));
								}
							}
						}

						// Send twitch_stream_message if necessary
						if(newusr.game && newusr.game.type==1 && (!oldusr.game || oldusr.game.type!=1) && serverDocument.config.moderation.status_messages.twitch_stream_message.isEnabled && serverDocument.config.moderation.status_messages.twitch_stream_message.discord_enabled && (serverDocument.config.moderation.status_messages.twitch_stream_message.enabled_user_ids.length==0 || serverDocument.config.moderation.status_messages.twitch_stream_message.enabled_user_ids.indexOf(oldusr.id)>-1)) {
							winston.info("Member '" + newusr.username + "' started streaming on Twitch", {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.twitch_stream_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage("**@" + bot.getName(svr, serverDocument, newmember) + "** is streaming on Twitch: " + newusr.game.url);
								}
							}
						}

						// Send member_game_updated_message if necessary
						if(bot.getGame(oldusr)!=bot.getGame(newusr) && serverDocument.config.moderation.status_messages.member_game_updated_message.isEnabled) {
							winston.info("Member '" + newusr.username + "' started playing '" + bot.getGame(newusr), {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_game_updated_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage("**@" + bot.getName(svr, serverDocument, newmember) + "** is now playing `" + bot.getGame(newusr));
								}
							}
						}

						// Send member_offline_message if necessary
						if(oldusr.status=="online" && newusr.status=="offline" && serverDocument.config.moderation.status_messages.member_offline_message.isEnabled) {
							winston.info("Member '" + newusr.username + "' went offline", {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_offline_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage(serverDocument.config.moderation.status_messages.member_offline_message.messages[getRandomInt(0, serverDocument.config.moderation.status_messages.member_offline_message.messages.length-1)].replaceAll("@user", "**@" + bot.getName(bot.guilds[i], serverDocument, newmember) + "**"));
								}
							}
						}

						// Send member_username_updated_message if necessary
						if(oldusr.username!=newusr.username && oldusr.username && newusr.username && serverDocument.config.moderation.status_messages.member_username_updated_message.isEnabled) {
							winston.info("Member '" + oldusr.username + "' changed username to '" + newusr.username + "'", {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_username_updated_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage("**@" + bot.getName(svr, serverDocument, svr.member(oldusr), true) + "** is now **@" + bot.getName(svr, serverDocument, newusr, true) + "**");
								}
							}
						}

						// Send member_avatar_updated_message if necessary
						if(oldusr.avatar!=newusr.avatar && serverDocument.config.moderation.status_messages.member_avatar_updated_message.isEnabled) {
							winston.info("Member '" + newusr.username + "' changed avatar from '" + oldusr.avatar + "' to '" + newusr.avatar + "'", {svrid: svr.id, usrid: oldusr.id});
							var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_avatar_updated_message.channel_id);
							if(ch) {
								var channelDocument = serverDocument.channels.id(ch.id);
								if(!channelDocument || channelDocument.bot_enabled) {
									ch.sendMessage("**@" + bot.getName(bot.guilds[i], serverDocument, newusr) + "** changed their avatar from " + (oldusr.avatarURL || "the default one") + " to " + (newusr.avatarURL || "the default one"));
								}
							}
						}
					}
				} else {
					winston.error("Failed to find server data for presence", {svrid: svr.id}, err);
				}
			});
		}

		// Iterate through all mutual servers with user
		bot.guilds.forEach(svr => {
			if(svr.members.find("id", oldusr.id)) {
				doPresence(svr);
			}
		});

		// Add old username to past names in profile
		if(oldusr.username!=newusr.username && oldusr.username && newusr.username) {
			db.users.findOrCreate({_id: oldusr.id}, (err, userDocument) => {
				if(!err && userDocument) {
					if(userDocument.past_names.indexOf(oldusr.username)==-1) {
						if(userDocument.past_names.length>3) {
							userDocument.past_names = [];
						}
						userDocument.past_names.push(oldusr.username);

						// Save changes to userDocument
						userDocument.save(err => {
							if(err) {
								winston.error("Failed to save user data for past names", {usrid: oldusr.id}, err)
							}
						});
					}
				} else {
					winston.error("Failed to find or create user data for past names", {usrid: oldusr.id}, err);
				}
			});
		}

		// Add last seen time to profile
		if(oldusr.status=="online" && newusr.status!="offline") {
			db.users.findOrCreate({_id: oldusr.id}, (err, userDocument) => {
				if(!err && userDocument) {
					userDocument.last_seen = Date.now();
					
					// Save changes to userDocument
					userDocument.save(err => {
						if(err) {
							winston.error("Failed to save user data for last seen", {usrid: oldusr.id}, err)
						}
					});
				} else {
					winston.error("Failed to find or create user data for last seen", {usrid: oldusr.id}, err);
				}
			});
		}
	}
};

// Get a random integer in specified range, inclusive
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}