// Message deleted
module.exports = (bot, db, winston, msg) => {
	if(msg && !msg.channel.isPrivate && msg.author.id!=bot.user.id && !msg.author.bot) {
		// Get server data
		db.servers.findOne({_id: msg.guild.id}, (err, serverDocument) => {
			if(!err && serverDocument) {
				// Get channel data
				var channelDocument = serverDocument.channels.id(msg.channel.id);
				// Create channel data if not found
				if(!channelDocument) {
					serverDocument.channels.push({_id: msg.channel.id});
					channelDocument = serverDocument.channels.id(msg.channel.id);
				}

				// Count server stats if enabled in this channel
				if(channelDocument.isStatsEnabled) {
					// Decrement this week's message count for member
					var memberDocument = serverDocument.members.id(msg.author.id);
					if(memberDocument && memberDocument.messages>0 && msg.timestamp>serverDocument.stats_timestamp) {
			            memberDocument.messages--;

			            // Save changes to serverDocument
			            serverDocument.save(err => {
							winston.error("Failed to save server data for messageDelete", {svrid: msg.guild.id}, err);
						});
			        }
		        }

		        // Undo vote based on previous message if necessary
		        for(var i=0; i<bot.voteTriggers.length; i++) {
                    if((" " + msg.content).indexOf(bot.voteTriggers[i])==0) {
                    	// Get previous message
                    	msg.channel.fetchMessages({
                    		limit: 1,
                    		before: msg.id
                    	}).then(messages => {
			                if(messages.first()) {
			                    if([msg.author.id, bot.user.id].indexOf(messages.first().author.id)==-1 && !messages.first().author.bot) {
			                    	// Get target user data
			                    	db.users.findOrCreate({_id: messages.first().author.id}, (err, targetUserDocument) => {
								       	if(!err && targetUserDocument) {
                                            // Increment points
                                            targetUserDocument.points--;
                                            
                                            // Save changes to targetUserDocument
                                            targetUserDocument.save(err => {
                                            	if(err) {
                                            		winston.error("Failed to save user data for points", {usrid: msg.author.id}, err);
                                            	}
                                            });
								       	} 
								    });
			                    }
			                }
			            }).catch();
                    	break;
                    }
                }

                // Send message_deleted_message if necessary
		        if(serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.status_messages.message_deleted_message.isEnabled && serverDocument.config.moderation.status_messages.message_deleted_message.enabled_channel_ids.indexOf(msg.channel.id)>-1 && !channelDocument.isMessageDeletedDisabled) {
		            winston.info("Message by member '" + msg.author.username + "' on server '" + msg.guild.name + "' deleted", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id});

		            // Send message in different channel
                    if(serverDocument.config.moderation.status_messages.message_deleted_message.channel_id) {
                    	var ch = msg.guild.channels.find("id", serverDocument.config.moderation.status_messages.message_deleted_message.channel_id);
                    	if(ch) {
                    		var targetChannelDocument = serverDocument.channels.id(ch.id);
                    		if(!targetChannelDocument || targetChannelDocument.bot_enabled) {
                    			ch.sendMessage("Message by **@" + bot.getName(msg.guild, serverDocument, msg.member) + "** in #" + msg.channel.name + " deleted:\n```" + msg.cleanContent + "```", {disable_everyone: true});
    						}
                    	}
                    // Send message in same channel
                	} else {
						var channelDocument = serverDocument.channels.id(msg.channel.id);
						if(!channelDocument || channelDocument.bot_enabled) {
							msg.channel.sendMessage("Message by **@" + bot.getName(msg.guild, serverDocument, msg.member) + "** deleted:\n```" + msg.cleanContent + "```", {disable_everyone: true});
						}
                	}
		        }
			} else {
				winston.error("Failed to find server data for message", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id}, err);
			}
		});
	}	
};