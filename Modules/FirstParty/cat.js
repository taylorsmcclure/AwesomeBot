const config = require("./../../Configuration/config.json");
const unirest = require("unirest");

// Produces random image of cats
module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
	unirest.get("http://random.cat/meow").end(res => {
		var image = "http://i.imgur.com/Bai6JTL.jpg";
		if(res.status==200) {
			image = res.body.file;
		}
		msg.channel.sendMessage(image);
	});
}
