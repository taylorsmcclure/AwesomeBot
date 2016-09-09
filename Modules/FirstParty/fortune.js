const unirest = require("unirest");

module.exports = function fortune(bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) {
    var categories = ["all", "computers", "cookie", "definitions", "miscellaneous", "people", "platitudes", "politics", "science", "wisdom"];
    if(suffix && categories.indexOf(suffix.toLowerCase())==-1) {
        var info = "Select one of the following:";
        for(var i=0; i<categories.length; i++) {
            info += "\n\t" + i + ") " + categories[i].charAt(0) + categories[i].slice(1);
        }
        msg.channel.sendMessage(info);
        msg.awaitMessages(message => {
            return message.author.id==msg.author.id && message.content && !isNaN(message.content) && parseInt(message.content)>=0 && parseInt(message.content)<categories.length;
        }, {
            time: 60000
        }).then(messages => {
            fortune(bot, db, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, categories[parseInt(messages.first().content)])
        }).catch();
    } else {
        unirest.get("http://yerkee.com/api/fortune/" + (suffix || ""))
        .header("Accept", "application/json")
        .end(res => {
            if(res.status==200) {
                msg.channel.sendMessage(res.body.fortune);
            } else {
                winston.warn(msg.guild.id, msg.channel.id,  "Failed to fetch fortune");
                msg.channel.sendMessage("I honestly don't know :neutral_face:");
            }
        });
    }
};
