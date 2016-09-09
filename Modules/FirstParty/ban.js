module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
    var member = bot.memberSearch(suffix, msg.guild);
    if(!suffix || !member || [msg.author.id, bot.user.id].indexOf(member.id) != -1) {
        winston.warn(msg.guild.id, msg.channel.id, "Error using ban command");
        msg.channel.sendMessage("Do you want me to ban you? :open_mouth:");
    } else {
        msg.guild.ban(member).then(() => {
            msg.channel.sendMessage("Ok, user banned :wave:");
        }).catch(err => {
            winston.error("Failed to ban " + member.user.username, {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id}, err);
            msg.channel.sendMessage("I don't have permission to ban on this server :sob:");
        });
    }
}
