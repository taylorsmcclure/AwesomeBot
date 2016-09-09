// User details updated on server (role, nickname, etc.)
module.exports = (bot, db, winston, svr, oldmember, newmember) => {
	db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
		if(!err && serverDocument) {
			// Send member_nick_updated_message if necessary
			if(serverDocument.config.moderation.status_messages.member_nick_updated_message.isEnabled) {
				var ch = svr.channels.find("id", serverDocument.config.moderation.status_messages.member_nick_updated_message.channel_id);
				if(ch) {
					var channelDocument = serverDocument.channels.id(ch.id);
					if(!channelDocument || channelDocument.bot_enabled) {
						// Nickname added
						if(oldmember.nickname!=newmember.nickname && !oldmember.nickname && newmember.nickname) {
							ch.sendMessage("**@" + bot.getName(svr, serverDocument, newmember) + "** got a nickname: `" + newmember.nickname + "`", {disable_everyone: true});
						}

						// Nickname changed
						if(oldmember.nickname!=newmember.nickname && oldmember.nickname && newmember.nickname) {
							ch.sendMessage("**@" + bot.getName(svr, serverDocument, newmember) + "** changed their nickname from `" + oldmember.nickname + "` to `" + newmember.nickname + "`", {disable_everyone: true});
						}

						// Nickname removed
						if(oldmember.nickname!=newmember.nickname && oldmember.nickname && !newmember.nickname) {
							ch.sendMessage("**@" + bot.getName(svr, serverDocument, newmember) + "** removed their nickname (`" + oldmember.nickname + "`)", {disable_everyone: true});
						}
					}
				}
			}	
		} else {
			winston.error("Failed to find server data for serverMemberUpdated", {svrid: svr.id}, err);
		}
	});
};