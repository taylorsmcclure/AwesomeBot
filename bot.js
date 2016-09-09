// Import and setup files and modules
var eventHandlers = {
	ready: require("./Events/ready.js"),
	guildCreate: require("./Events/guildCreate.js"),
	guildUpdate: require("./Events/guildUpdate.js"),
	guildDelete: require("./Events/guildDelete.js"),
	channelDelete: require("./Events/channelDelete.js"),
	guildRoleUpdated: require("./Events/guildRoleUpdated.js"),
	guildRoleDelete: require("./Events/guildRoleDelete.js"),
	guildMemberAdd: require("./Events/guildMemberAdd.js"),
	guildMemberUpdate: require("./Events/guildMemberUpdate.js"),
	guildMemberRemove: require("./Events/guildMemberRemove.js"),
	guildMemberSpeaking: require("./Events/guildMemberSpeaking.js"),
	guildBanAdd: require("./Events/guildBanAdd.js"),
	guildBanRemove: require("./Events/guildBanRemove.js"),
	message: require("./Events/message.js"),
	messageUpdate: require("./Events/messageUpdate.js"),
	messageDelete: require("./Events/messageDelete.js"),
	presenceUpdate: require("./Events/presenceUpdate.js"),
	voiceStateUpdate: require("./Events/voiceStateUpdate.js")
};
const database = require("./Database/Driver.js");

const auth = require("./Configuration/auth.json");
var config = require("./Configuration/config.json");
const winston = require("winston");
const domain = require("domain");

// Set up default winston logger
winston.add(winston.transports.File, {
	filename: "bot-out.log"
});
winston.log("info", "Started bot application");

// Connect to and initialize database
var db;
database.initialize(config.db_url, err => {
	if(err) {
		winston.log("error", "Failed to connect to database");
		process.exit(1);
	} else {
		db = database.get();
		winston.log("info", "Connected to database, attempting login...");

		// Get bot client from platform
		var bot = require("./Platform/Platform.js")(db);

		// Login to bot account with auth token
		bot.login("Bot " + auth.platform.login_token);

		// After guilds and users have been created (first-time only)
		bot.once("ready", () => {
			eventHandlers.ready(bot, db, winston);
		});

		// Server joined by bot
		bot.on("guildCreate", svr => {
			const guildCreateDomain = domain.create();
			guildCreateDomain.run(() => {
				eventHandlers.guildCreate(bot, db, winston, svr);
			});
			guildCreateDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Server details updated (name, icon, etc.)
		bot.on("guildUpdate", (oldsvr, newsvr) => {
			const guildUpdateDomain = domain.create();
			guildUpdateDomain.run(() => {
				eventHandlers.guildUpdate(bot, db, winston, oldsvr, newsvr);
			});
			guildUpdateDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Server left by bot or deleted
		bot.on("guildDelete", svr => {
			const guildDeleteDomain = domain.create();
			guildDeleteDomain.run(() => {
				eventHandlers.guildDelete(bot, db, winston, svr);
			});
			guildDeleteDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Server channel deleted
		bot.on("channelDelete", ch => {
			const channelDeleteDomain = domain.create();
			channelDeleteDomain.run(() => {
				eventHandlers.channelDelete(bot, db, winston, ch);
			});
			channelDeleteDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Server role details updated (name, permissions, etc.)
		bot.on("guildRoleUpdated", (svr, oldrole, newrole) => {
			const guildRoleUpdatedDomain = domain.create();
			guildRoleUpdatedDomain.run(() => {
				eventHandlers.guildRoleUpdated(bot, db, winston, svr, oldrole, newrole);
			});
			guildRoleUpdatedDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Server role deleted
		bot.on("guildRoleDelete", (svr, role) => {
			const guildRoleDeleteDomain = domain.create();
			guildRoleDeleteDomain.run(() => {
				eventHandlers.guildRoleDelete(bot, db, winston, svr, role);
			});
			guildRoleDeleteDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// User joined server
		bot.on("guildMemberAdd", (svr, member) => {
			const guildMemberAddDomain = domain.create();
			guildMemberAddDomain.run(() => {
				eventHandlers.guildMemberAdd(bot, db, winston, svr, member);
			});
			guildMemberAddDomain.on("error", err => {
				winston.log("error", err);
			})
		});

		// User details updated on server (role, nickname, etc.)
		bot.on("guildMemberUpdate", (svr, oldmember, newmember) => {
			const guildMemberUpdateDomain = domain.create();
			guildMemberUpdateDomain.run(() => {
					eventHandlers.guildMemberUpdate(bot, db, winston, svr, oldmember, newmember);
			});
			guildMemberUpdateDomain.on("error", err => {
				winston.log("error", err);
			})
		});

		// User left or kicked from server
		bot.on("guildMemberRemove", (svr, member) => {
			const guildMemberRemoveDomain = domain.create();
			guildMemberRemoveDomain.run(() => {
				eventHandlers.guildMemberRemove(bot, db, winston, svr, member);
			});
			guildMemberRemoveDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// User started/stopped speaking in voice channel
		bot.on("guildMemberSpeaking", (member, isSpeaking) => {
			const guildMemberSpeakingDomain = domain.create();
			guildMemberSpeakingDomain.run(() => {
				eventHandlers.guildMemberSpeaking(bot, db, winston, member, isSpeaking);
			});
			guildMemberSpeakingDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// User banned from server
		bot.on("guildBanAdd", (svr, member) => {
			const guildBanAddDomain = domain.create();
			guildBanAddDomain.run(() => {
				eventHandlers.guildBanAdd(bot, db, winston, svr, member);
			});
			guildBanAddDomain.on("error", err => {
				winston.log("error", err);
			});
		})

		// User unbanned from server
		bot.on("guildBanRemove", (svr, member) => {
			const guildBanRemoveDomain = domain.create();
			guildBanRemoveDomain.run(() => {
				eventHandlers.guildBanRemove(bot, db, winston, svr, member);
			});
			guildBanRemoveDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Message sent on server
		bot.on("message", msg => {
			const messageDomain = domain.create();
			messageDomain.run(() => {
				eventHandlers.message(bot, db, winston, msg);
			});
			messageDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Message updated (edited, functionpinned, etc.)
		bot.on("messageUpdate", (oldmsg, newmsg) => {
			const messageUpdateDomain = domain.create();
			messageUpdateDomain.run(() => {
				eventHandlers.messageUpdate(bot, db, winston, oldmsg, newmsg);
			});
			messageUpdateDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// Message deleted
		bot.on("messageDelete", msg => {
			const messageDeleteDomain = domain.create();
			messageDeleteDomain.run(() => {
				eventHandlers.messageDelete(bot, db, winston, msg);
			});
			messageDeleteDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// User status changed (afk, new game, etc.)
		bot.on("presenceUpdate", (oldusr, newusr) => {
			const presenceUpdateDomain = domain.create();
			presenceUpdateDomain.run(() => {
				eventHandlers.presenceUpdate(bot, db, winston, oldusr, newusr);
			});
			presenceUpdateDomain.on("error", err => {
				winston.log("error", err);
			});
		});

		// User voice connection details updated on server (muted, deafened, etc.)
		bot.on("voiceStateUpdate", (oldmember, newmember) => {
			const voiceStateUpdateDomain = domain.create();
			voiceStateUpdateDomain.run(() => {
				eventHandlers.voiceStateUpdate(bot, db, winston, oldmember, newmember);
			});
			voiceStateUpdateDomain.on("error", err => {
				winston.log("error", err);
			});
		});
	}
});
