// User started/stopped speaking in voice channel
module.exports = (bot, db, winston, member, isSpeaking) => {
	var svr = member.guild;
	var ch = member.voiceChannel;

	if(!member.user.bot && (svr.afkChannelID || ch.id!=svr.afkChannelID)) {
		db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
			if(!err && serverDocument) {
				// User is speaking
				if(isSpeaking) {
					// Begin timing voice activity
					var voiceDocument = serverDocument.voice_data.id(member.id);
					if(!voiceDocument) {
						serverDocument.voice_data.push({
							_id: member.id,
							started_timestamp: Date.now()
						});
			           	voiceDocument = serverDocument.voice_data.id(member.id);
			        }

			        // Set now as the last active time for member
		           	var memberDocument = serverDocument.members.id(member.id);
		           	if(!memberDocument) {
		           		serverDocument.members.push({_id: member.id});
		           		memberDocument = serverDocument.members.id(member.id);
		           	}
		            memberDocument.last_active = Date.now();

		            // Save changes to serverDocument
		            serverDocument.save(err => {
	            		if(err) {
	            			winston.error("Failed to save server data for serverMemberSpeaking", {svrid: svr.id}, err);
	            		}
		            });
				// User stopped speaking
				} else {
					// Calculate activity score for voice connection
					var voiceDocument = serverDocument.voice_data.id(member.id);
					if(voiceDocument) {
						var memberDocument = serverDocument.members.id(member.id);
			           	if(!memberDocument) {
			           		serverDocument.members.push({_id: member.id});
			           		memberDocument = serverDocument.members.id(member.id);
			           	}
			           	memberDocument.voice += Math.ceil(((Date.now() - voiceDocument.started_timestamp)/1000)/60);
			           	voiceDocument.remove();
			           	bot.checkRank(winston, svr, serverDocument, member, memberDocument);
					}

					// Save changes to serverDocument
		            serverDocument.save(err => {
	            		if(err) {
	            			winston.error("Failed to save server data for serverMemberSpeaking", {svrid: svr.id}, err);
	            		}
		            });
				}
			} else {
				winston.error("Failed to find server data for serverMemberSpeaking", {svrid: svr.id}, err);
			}
		});
	}
};