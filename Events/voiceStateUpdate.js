// User voice connection updated on server
module.exports = (bot, db, winston, oldmember, newmember) => {
	if(!oldmember.user.bot) {
		var svr = oldmember.guild;

		// Voice channel joined
		if(!oldmember.voiceChannel && newmember.voiceChannel) {
			var ch = newmember.voiceChannel;
			if(!svr.afkChannelID || ch.id!=svr.afkChannelID) {
				db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
					if(!err && serverDocument) {
				        // If this is a voice channel that has voicetext enabled
				        if(serverDocument.config.voicetext_channels.indexOf(ch.id)>-1) {
				        	// Add member to voicetext channel
				            function addToVoicetext(channel) {
				                channel.overwritePermissions(oldmember, {
				                    "READ_MESSAGES": true,
				                    "SEND_MESSAGES": true
				                }).then().catch(err => {
			                    	winston.error("Failed to add member '" + oldmember.user.username + "' to voicetext channel '" + channel.name + "' on server '" + svr.name + "'", {svrid: svr.id, chid: channel.id, usrid: oldmember.id}, err);
				                });
				            };

				            // Create voicetext channel if necessary
				            var channel = svr.channels.find("name", ch.name.replaceAll(" ", "").toLowerCase() + "-voicetext");
				            if(!channel) {
				                svr.createChannel(ch.name.replaceAll(" ", "").toLowerCase() + "-voicetext").then(channel => {
				                    channel.overwritePermissions(svr.roles.find("name", "@everyone"), {
				                        "READ_MESSAGES": false,
				                        "SEND_MESSAGES": false,
				                    }).then(() => {
				                    	addToVoicetext(channel);
				                    }).catch(err => {
				                        	winston.error("Failed to create voicetext channel for '" + ch.name + "' on server '" + svr.name + "'", {svrid: svr.id, chid: ch.id}, err);
				                    });
				                }).catch();
				            } else {
				                addToVoicetext(channel);
				            }
				        }
					} else {
						winston.error("Failed to find server data for voiceJoin", {svrid: svr.id}, err);
					}
				});
			}
		// Voice channel left
		} else if(oldmember.voiceChannel && !newmember.voiceChannel) {
			var ch = oldmember.voiceChannel;
			if(!svr.afkChannelID || ch.id!=svr.afkChannelID) {
				db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
					if(!err && serverDocument) {
						// Remove member from voicetext channel if necessary
						if(serverDocument.config.voicetext_channels.indexOf(ch.id)>-1) {
				            var channel = svr.channels.find("name", ch.name.replaceAll(" ", "").toLowerCase() + "-voicetext");
				            if(channel) {
				                channel.overwritePermissions(oldmember, {
				                    "READ_MESSAGES": false,
				                    "SEND_MESSAGES": false
				                }).then().catch(err => {
			                    	winston.error("Failed to remove member '" + oldmember.user.username + "' from voicetext channel '" + channel.name + "' on server '" + svr.name + "'", {svrid: svr.id, chid: channel.id, usrid: oldmember.id}, err);
				                });
				            }
				        }

				        // Delete channel if it's from the room command
				        const roomDocument = serverDocument.config.room_data.id(ch.id);
				        if(roomDocument && ch.members.length==0) {
					        ch.delete().then(() => {
				                roomDocument.remove();
				                winston.info("Auto-deleted voice room '" + ch.name + "' on server '" + svr.name + "'", {svrid: svr.id, chid: ch.id});
					        }).catch(err => {
				        		winston.info("Failed to auto-deleted voice room '" + ch.name + "' on server '" + svr.name + "'", {svrid: svr.id, chid: ch.id});
					        });
					    }

					    // Save changes to serverDocument
			            serverDocument.save(err => {
		            		if(err) {
		            			winston.error("Failed to save server data for voiceLeave", {svrid: svr.id}, err);
		            		}
			            });
					} else {
						winston.error("Failed to find server data for voiceLeave", {svrid: svr.id}, err);
					}
				});
			}
		}
	}
};