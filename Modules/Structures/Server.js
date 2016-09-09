const Cache = require("./Cache.js");
const Channel = require("./Channel.js");
const Role = require("./Role.js");
const User = require("./User.js");
const Invite = require("./Invite.js");

// Server object for extensions
module.exports = class Server {
	constructor(bot, db, svr, serverDocument, isTesting, testingLog) {
		this.name = svr.name;
        this.id = svr.id;
        this.created = svr.creationDate;
        this.features = svr.features;
        this.verificationLevel = svr.verificationLevel;
        this.splash = svr.splash;
        this.icon = svr.iconURL;
        this.region = svr.region;
        this.defaultChannel = new Channel(bot, db, svr.defaultChannel(), serverDocument, isTesting, testingLog);
        this.channels = new Cache();
        svr.channels.forEach(ch => {
        	if(ch.type=="text") {
        		this.channels.push(new Channel(bot, db, ch, serverDocument, isTesting, testingLog));
        	}
        });
        this.channels.sort((a, b) => {
            return a.position - b.position;
        })
        this.owner = new User(bot, db, svr.owner, svr, serverDocument, isTesting, testingLog);
        this.members = new Cache();
        svr.members.forEach(member => {
        	this.members.push(new User(bot, db, member, svr, serverDocument, isTesting, testingLog));
        });
        this.large = svr.large;
        this.roles = new Cache();
        svr.roles.forEach(role => {
        	this.roles.push(new Role(bot, db, svr, serverDocument, role, isTesting, testingLog));
        });
        this.roles.sort((a, b) => {
            return a.position - b.position;
        })
        this.data = serverDocument.toObject();
        this.getInvites = callback => {
            svr.fetchInvites().then((invites) => {
                invites = invites.array();
                for(var i=0; i<invites.length; i++) {
                    invites[i] = new Invite(bot, db, invites[i], serverDocument, isTesting, testingLog);
                }
                callback(null, invites);
            }).catch(callback);
        };
        this.userSearch = str => {
            var member = bot.memberSearch(str, svr);
            return member ? new User(bot, db, member, svr, serverDocument, isTesting, testingLog) : null;
        };
        this.createChannel = (name, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Created channel \"" + name + "\"");
            }
        	var that = this;
            svr.createChannel(name, "text").then((newChannel, err) => {
            	var ch;
            	if(!err) {
            		ch = new Channel(bot, db, newChannel, serverDocument, isTesting, testingLog);
            		that.channels.push(ch);
            	}
            	if(typeof(callback)=="function") {
            		callback(err, ch);
            	}
            });
        }
        this.createRole = (options, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Created role with options " + JSON.stringify(options));
            }
        	var that = this;
            svr.createRole(options).then((newRole, err) => {
            	var role;
            	if(!err) {
            		role = new Role(bot, db, svr, serverDocument, newRole, isTesting, testingLog);
            		that.roles.push(role);
            	}
            	if(typeof(callback)=="function") {
            		callback(err, role);
            	}
            });
        };
        this.setName = (name, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set name of server to \"" + name + "\"");
            }
            var that = this;
            svr.setName(name).then((newServer, err) => {
                if(!err) {
                    that.name = newServer.name;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setVerificationLevel = (verificationLevel, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set verification level of server to " + verificationLevel);
            }
            var that = this;
            svr.setVerificationLevel(verificationLevel).then((newServer, err) => {
                if(!err) {
                    that.verificationLevel = newServer.verificationLevel;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setIcon = (icon, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set icon of server to \"" + icon + "\"");
            }
            var that = this;
            svr.setIcon(icon).then((newServer, err) => {
                if(!err) {
                    that.icon = newServer.iconURL;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setRegion = (region, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set region of server to " + region);
            }
            var that = this;
            svr.setRegion(region).then((newServer, err) => {
                if(!err) {
                    that.region = newServer.region;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
	}
}