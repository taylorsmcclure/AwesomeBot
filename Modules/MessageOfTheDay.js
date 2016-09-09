// Send message of the day to a server
module.exports = (bot, winston, svr, motd) => {
	function sendMOTD() {
		if(motd.isEnabled) {
			var ch = svr.channels.find("id", motd.channel);
			if(ch) {
				motd.last_run = Date.now();
				motd.save(err => {
					if(err) {
						winston.error("Failed to save message of the day data", {svrid: svr.id}, err);
					}
				});
				ch.sendMessage(motd.message_content);
			}
			setTimeout(sendMOTD, motd.interval);
		}
	}
	setTimeout(() => {
		sendMOTD();
	}, (motd.last_run + motd.interval) - Date.now());
};