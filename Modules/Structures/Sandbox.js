const Extension = require("./Extension.js");
const Bot = require("./InternalBot.js");
const Server = require("./Server.js");
const Channel = require("./Channel.js");
const Message = require("./Message.js");

const getGIF = require("./../GiphySearch.js");
const giSearch = require("./../GoogleImageSearch.js");
const getRSS = require("./../RSS.js");
const prettyDate = require("./../PrettyDate.js");
const secondsToString = require("./../PrettySeconds.js");
const parseTime = require("./../TimeParser.js");

const unirest = require("unirest");
const xmlparser = require("xml-parser");
const imgur = require("imgur-node-api");

// Base set of extensionDocument parameters
module.exports = (bot, db, winston, extensionDocument, svr, serverDocument, ch, msg, suffix, keywordMatch, isTesting, testingLog) => {
	if(isTesting) {
		extensionDocument.store = {};
	}
	var params = {
		extension: new Extension(winston, extensionDocument, svr, serverDocument, isTesting, testingLog),
		unirest: unirest,
		xmlparser: xmlparser,
        imgur: imgur,
        gif: (query, rating, callback) => {
            if(!callback) {
            	callback = rating;
                rating = "pg-13";
                if(!serverDocument.config.moderation.isEnabled || !serverDocument.config.moderation.filters.nsfw_filter.isEnabled || serverDocument.config.moderation.filters.nsfw_filter.enabled_channel_ids.indexOf(ch.id)==-1) {
                    rating = "r";
                }
            }
            getGIF(query, rating, callback);
        },
        image: (query, safe, num, callback) => {
        	if(!callback && num!=null) {
        		callback = num;
        		if(typeof(safe)=="boolean") {
        			num = 0;
        		} else {
        			num = safe;
        			safe = serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.filters.nsfw_filter.isEnabled && serverDocument.config.moderation.filters.nsfw_filter.enabled_channel_ids.indexOf(ch.id)>-1;
        		}
        	} else if(!callback && num==null) {
        		callback = safe;
        		safe = serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.filters.nsfw_filter.isEnabled && serverDocument.config.moderation.filters.nsfw_filter.enabled_channel_ids.indexOf(ch.id)>-1;
        		num = 0;
        	}
            giSearch(serverDocument, query, safe, num, callback);
        },
        rss: (url, num, callback) => {
            getRSS(winston, url, num, callback);
        },
        bot: new Bot(bot, db, svr, serverDocument, isTesting, testingLog),
        svr: new Server(bot, db, svr, serverDocument, isTesting, testingLog),
        ch: new Channel(bot, db, ch, serverDocument, isTesting, testingLog),
        parseTime: parseTime,
        prettyDate: prettyDate,
        secondsToString: secondsToString,
        setTimeout: setTimeout,
        JSON: JSON,
        Math: Math,
        isNaN: isNaN,
        isFinite: isFinite,
        Date: Date,
        RegExp: RegExp,
        Array: Array,
        Number: Number,
        Object: Object,
        encodeURI: encodeURI,
        decodeURI: decodeURI,
        parseInt: parseInt,
        parseFloat: parseFloat,
        util: util,
        logMsg: (level, message) => {
            if(!message) {
                message = level;
                level = "info";
            }
            if(["info", "warn", "error"].indexOf(level.toLowerCase())>-1) {
                if(isTesting) {
                    testingLog.push(level.toLowerCase() + ": " + util.inspect(message));
                } else {
                    winston.log(level.toLowerCase(), "Extension '" + extensionDocument._id + "' log on server '" + svr.name + "' in channel '" + ch.name + "': " + message, {svrid: svr.id, chid: ch.id});
                }
            } else if(isTesting) {
                testingLog.push("ERROR: Invalid level \"" + level + "\" in call to logMsg");
            }
        }
	};

    if(msg && ["keyword", "command"].indexOf(extensionDocument.type)>-1) {
        params.msg = new Message(bot, db, msg, serverDocument, isTesting, testingLog);
    }
    if(extensionDocument.type=="keyword" && keywordMatch) {
        params.keywordMatch = keywordMatch;
    }
    if(extensionDocument.type=="command") {
        params.commandSuffix = suffix.trim();
    }
    return params;
};