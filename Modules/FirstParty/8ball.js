const unirest = require("unirest");

module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
    if(suffix) {
        unirest.get("https://8ball.delegator.com/magic/JSON/" + encodeURI(suffix.replaceAll("&", ""))).header("Accept", "application/json").end(res => {
            if(res.status==200) {
                msg.channel.sendMessage("```" + res.body.magic.answer + "```");
            } else {
                winston.error("Failed to fetch 8ball answer", {svrid: msg.guild.id, chid: msg.channel.id});
                msg.channel.sendMessage("Broken 8ball :(");
            }
        });
    } else {
        winston.warn("No parameters provided for 8ball command", {svrid: msg.guild.id, chid: msg.channel.id});
        msg.channel.sendMessage(msg.author + " You tell me... :stuck_out_tongue_winking_eye:");
    }
}

String.prototype.replaceAll = (target, replacement) => {
    return this.split(target).join(replacement);
};