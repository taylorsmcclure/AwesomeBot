const unirest = require("unirest");

module.exports = (bot, winston, auth) => {
    // Send server count to Carbonitex bot list
    if(auth.tokens.carbon_key) {
        unirest.post("https://www.carbonitex.net/discord/data/botdata.php").headers({
            "Accept": "application/json",
            "Content-Type": "application/json"
        }).send({
            "key": auth.tokens.carbon_key,
            "servercount": bot.guilds.length
        }).end(res => {
            if(res.status==200) {
                winston("info", "Successfully POSTed updated server count to Carbonitex");
            }
        });
    }
};