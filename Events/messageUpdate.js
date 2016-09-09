const runExtension = require("./../Modules/ExtensionRunner.js");
const checkFiltered = require("./../Modules/FilterChecker.js");

// Message updated (edited, pinned, etc.)
module.exports = (bot, db, winston, oldmsg, newmsg) => {
	if(oldmsg && newmsg && oldmsg.channel.type!="dm" && oldmsg.author!=bot.user.id && !oldmsg.author.bot) {
        // Get server data
		db.servers.findOne({_id: oldmsg.guild.id}, (err, serverDocument) => {
			if(!err && serverDocument) {
				if(oldmsg.cleanContent && newmsg.cleanContent && oldmsg.cleanContent!=newmsg.cleanContent) {
					// Send message_edited_message if necessary
	                if(serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.status_messages.message_edited_message.isEnabled && serverDocument.config.moderation.status_messages.message_edited_message.enabled_channel_ids.indexOf(oldmsg.channel.id)>-1) {
	                    winston.info("Message by member '" + oldmsg.author.username + "' on server '" + oldmsg.guild.name + "' edited", {svrid: oldmsg.guild.id, chid: oldmsg.channel.id, usrid: oldmsg.author.id});

	                    // Send message in different channel
	                    if(serverDocument.config.moderation.status_messages.message_edited_message.channel_id) {
	                    	var ch = oldmsg.guild.channels.find("id", serverDocument.config.moderation.status_messages.message_edited_message.channel_id);
	                    	if(ch) {
	                    		var targetChannelDocument = serverDocument.channels.id(ch.id);
	                    		if(!targetChannelDocument || targetChannelDocument.bot_enabled) {
	                    			ch.sendMessage("Message by **@" + bot.getName(oldmsg.guild, serverDocument, oldmsg.member) + "** in #" + oldmsg.channel.name + " edited. Original:\n```" + oldmsg.cleanContent + "```Updated:\n```" + newmsg.cleanContent + "```", {disable_everyone: true});
	                    		}
	                    	}
	                    // Send message in same channel
	                	} else {
							var channelDocument = serverDocument.channels.id(oldmsg.channel.id);
							if(!channelDocument || channelDocument.bot_enabled) {
								oldmsg.channel.sendMessage("Message by **@" + bot.getName(oldmsg.guild, serverDocument, oldmsg.member) + "** edited. Original:\n```" + oldmsg.cleanContent + "```Updated:\n```" + newmsg.cleanContent + "```", {disable_everyone: true});
							}
	                	}
	                }

	                // Check if using a filtered word again
	                if(checkFiltered(serverDocument, oldmsg.channel, newmsg.cleanContent, false, true)) {
						// Delete offending message if necessary
						if(serverDocument.config.moderation.filters.custom_filter.delete_message) {
							bot.delete().then().catch(err => {
								winston.error("Failed to delete filtered message from member '" + oldmsg.author.username + "' in channel '" + oldmsg.channel.name + "' on server '" + oldmsg.guild.name + "'", {svrid: oldmsg.guild.id, chid: oldmsg.channel.id, usrid: oldmsg.author.id}, err);
							});
						}

						// Handle this as a violation
						bot.handleViolation(winston, oldmsg.guild, serverDocument, oldmsg.channel, oldmsg.member, userDocument, memberDocument, "You used a filtered word in #" + oldmsg.channel + " on " + oldmsg.guild.name, "**@" + bot.getName(svr, serverDocument, oldmsg.member, true) + "** used a filtered word (edited: `" + newmsg.cleanContent + "`) in #" + oldmsg.channel.name + " on " + oldmsg.guild.name, "Word filter violation (edited: \"" + newmsg.cleanContent + "\") in #" + oldmsg.channel.name, serverDocument.config.moderation.filters.custom_filter.action, serverDocument.config.moderation.filters.custom_filter.violator_role_id);
					}

	                // Apply keyword extensions again
	                for(var i=0; i<serverDocument.config.extensions.length; i++) {
						if(serverDocument.config.extensions[i].type=="keyword" && (!serverDocument.config.extensions[i].isAdminOnly || memberBotAdmin>0) && serverDocument.config.extensions[i].enabled_channel_ids.indexOf(oldmsg.channel.id)>-1) {
							var keywordMatch = newmsg.content.containsArray(serverDocument.config.extensions[i].keywords);
							if(((serverDocument.config.extensions[i].keywords.length>1 || serverDocument.config.extensions[i].keywords[0]!="*") && keywordMatch.selectedKeyword>-1) || (serverDocument.config.extensions[i].keywords.length==1 && serverDocument.config.extensions[i].keywords[0]=="*")) {
								winston.info("Treating '" + newmsg.cleanContent + "' as a trigger for keyword extension '" + serverDocument.config.extensions[i]._id + "'", {svrid: oldmsg.guild.id, chid: oldmsg.channel.id, usrid: oldmsg.author.id});
								extensionApplied = true;
								runExtension(bot, winston, oldmsg.guild, oldmsg.channel, serverDocument.config.extensions[i], newmsg, null, keywordMatch);
							}
						}
					}
	            }

	            // Send message_pinned_message if necessary
	            if(oldmsg.pinned!=newmsg.pinned && serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.status_messages.message_pinned_message.isEnabled && serverDocument.config.moderation.status_messages.message_pinned_message.enabled_channel_ids.indexOf(oldmsg.channel.id)>-1) {
	                var action = (!oldmsg.pinned && newmsg.pinned) ? "pinned" : "unpinned";
	                winston.info("Message by member '" + oldmsg.author.username + "' on server '" + oldmsg.guild.name + "' " + action, {svrid: oldmsg.guild.id, chid: oldmsg.channel.id, usrid: oldmsg.author.id});

	                // Send message in different channel
                    if(serverDocument.config.moderation.status_messages.message_pinned_message.channel_id) {
                    	var ch = oldmsg.guild.channels.find("id", serverDocument.config.moderation.status_messages.message_pinned_message.channel_id);
                    	if(ch) {
                    		var targetChannelDocument = serverDocument.channels.id(ch.id);
                    		if(!targetChannelDocument || targetChannelDocument.bot_enabled) {
                    			ch.sendMessage("```" + oldmsg.cleanContent + "```By **@" + getName(oldmsg.guild, serverDocument, oldmsg.member) + "** in #" + oldmsg.channel.name + " " + action + ".", {disable_everyone: true});
							}
                    	}
                    // Send message in same channel
                	} else {
						var channelDocument = serverDocument.channels.id(oldmsg.channel.id);
						if(!channelDocument || channelDocument.bot_enabled) {
							oldmsg.channel.sendMessage("```" + oldmsg.cleanContent + "```By **@" + getName(oldmsg.guild, serverDocument, oldmsg.member) + "** " + action + ".", {disable_everyone: true});
						}
                	}
	            }
			} else {
				winston.error("Failed to find server data for message", {svrid: oldmsg.guild.id, chid: oldmsg.channel.id, usrid: oldmsg.author.id}, err);
			}
		});
    }
};

// Check if string contains at least one element in array
String.prototype.containsArray = (arr, isCaseSensitive) => {
	var selectedKeyword = -1;
	var keywordIndex = -1;
	for(var i=0; i<arr.length; i++) {
		if(isCaseSensitive && this.contains(arr[i])) {
			selectedKeyword = i;
			keywordIndex = this.indexOf(arr[i]);
			break;
		} else if(!isCaseSensitive && this.toLowerCase().contains(arr[i].toLowerCase())) {
			selectedKeyword = i;
			keywordIndex = this.toLowerCase().indexOf(arr[i].toLowerCase());
			break;
		}
	}
	return {
		selectedKeyword: selectedKeyword,
		keywordIndex: keywordIndex
	};
};

// Get a random integer in specified range, inclusive
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}