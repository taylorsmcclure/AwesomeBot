const imgur = require("imgur-node-api");

module.exports = (bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
    var member;
    if(!suffix || suffix.toLowerCase()=="me") {
        member = msg.author;
    } else {
        member = bot.memberSearch(suffix, msg.guild);
    }
    if(member) {
        var useImgur = suffix.indexOf(" imgur") != -1;
        if(!member.user.avatarURL) {
            msg.channel.sendFile("http://i.imgur.com/fU70HJK.png");
        } else {
            if(useImgur) {
                imgur.upload(member.user.avatarURL, (err, res) => {
                    if(err) {
                        msg.channel.sendFile(member.user.avatarURL);
                    } else {
                        msg.channel.sendFile(res.data.link);
                    }
                });
            } else {
                msg.channel.sendFile(member.user.avatarURL);
            }
        }
    } else {
        winston.warn("Requested member does not exist so avatar cannot be shown", {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id});
        msg.channel.sendMessage("I don't know who that is, so you can look at my beautiful face instead :heartbeat:").then(() => {
            msg.channel.sendFile(bot.user.avatarURL || "http://i.imgur.com/fU70HJK.png");
        });
    }
}
