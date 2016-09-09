const genToken = require("./../GenerateToken.js");
const fs = require("fs");

module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
    if(!suffix || isNaN(suffix)) {
        winston.warn("No parameters provided for archive command", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id});
        msg.channel.sendMessage(msg.author + " I'll need a number of messages to fetch, please :1234:");
    } else {
        bot.getMessages(msg.channel, serverDocument, parseInt(suffix), (err, archive) => {
            if(err) {
                winston.error("Failed to archive " + suffix + " messages", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id}, err);
                msg.channel.sendMessage(":octagonal_sign: Discord prevented me from completing this task, are you sure I have message history permisssions?");
            } else {
                var filename = "./" + msg.channel.id + "-" + genToken(8) + ".json";
                fs.writeFile(filename, JSON.stringify(archive, null, 4), err => {
                    if(err) {
                        winston.error("Failed to write temporary archive", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id}, err);
                        msg.channel("Failed to store archive");
                    } else {
                        msg.channel.sendFile(filename, msg.guild.name + "-" + msg.channel.name + "-" + Date.now() + ".json").then((message, err) => {
                            if(err) {
                                winston.error("Failed to send archive", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id}, err);
                                msg.channel.sendMessage("Discord is getting mad at me. :sweat_smile: Try a smaller number of messages.");
                            }
                            fs.unlinkSync(filename);
                        });
                    }
                });
            }
        });
    }
}
