const config = require("./../Configuration/config.json");
const auth = require("./../Configuration/auth.json");
const postData = require("./../Modules/PostData.js");
const webserver = require("./../Web/WebServer.js");
const getNewServerData = require("./../Modules/NewServer.js");
const setReminder = require("./../Modules/SetReminder.js");
const setCountdown = require("./../Modules/SetCountdown.js");
const sendStreamingRSSUpdates = require("./../Modules/StreamingRSS.js");
const sendMessageOfTheDay = require("./../Modules/MessageOfTheDay.js");
const runExtension = require("./../Modules/ExtensionRunner.js");

const unirest = require("unirest");

module.exports = (bot, db, winston) => {
	winston.info("Successfully logged into Discord");

	// POST to AwesomeBot version host and bot lists
	postData(bot, winston, auth);

	// Initialize web interface endpoints
	webserver.initialize(bot, db, winston);

	// Ensure that all servers hava database documents
	var newServerDocuments = [];
	function checkServerData(i, callback) {
		if(i<bot.guilds.length) {
			db.servers.findOne({_id: bot.guilds[i].id}, (err, serverDocument) => {
				if(err) {
					winston.error("Failed to find server data", {svrid: bot.guilds[i].id}, err);
					process.exit(1);
				} else if(serverDocument) {
					var channelIDs = bot.guilds[i].channels.map(a => {
						return a.id;
					});
					for(var j=0; j<serverDocument.channels.length; j++) {
						if(channelIDs.indexOf(serverDocument.channels[j].id)==-1) {
							serverDocument.channels[j].remove();
						}
					}
				} else {
					newServerDocuments.push(getNewServerData(bot, bot.guilds[i], new db.servers({_id: bot.guilds[i].id})));
				}
				checkServerData(++i, callback);
			});
		} else {
			callback();
		}
	}
	checkServerData(0, () => {
		if(newServerDocuments.length>0) {
			db.servers.insertMany(newServerDocuments, (err, insertedDocuments) => {
				if(err) {
					winston.error("Failed to insert new server documents", err);
					process.exit(1);
				} else {
					winston.info("Successfully inserted " + newServerDocuments.length + " new server documents into database");
					setReminders();
				}
			});
		} else {
			pruneServerData();
			setReminders();
		}
	});

	// Delete data for old servers
	function pruneServerData(i, callback) {
		db.servers.find({_id: {"$nin": bot.guilds.map(a => {
			return a.id;
		})}}).remove(err => {
			if(err) {
				winston.error("Failed to prune old server documents", err);
			}
			setBotGame();
			startMessageCount();
		});
	}

	// Set bot's "now playing" game
	function setBotGame(i) {
		var botGames = [bot.guilds.length + " server" + (bot.guilds.length==1 ? "" : "s") + " connected", "serving " + bot.users.length + " users", "awesomebot.xyz", "v" + config.version, config.hosting_url || "limited mode", "the best Discord bot!", "discord.awesomebot.xyz"];
		if(config.game=="default") {
			if(i==null || i>=botGames.length) {
				i = 0;
			}
			try {
				bot.user.setStatus("online", botGames[i]);
	            setTimeout(() => {
	                setBotGame(++i);
	            }, 30000);
			} catch(err) {
				winston.error("Failed to set bot game", err);
			}
		} else {
			bot.user.setStatus("online", config.game);
		}
	}

	// Set messages_today to 0 for all servers
	function startMessageCount() {
		db.servers.update({}, {messages_today: 0}, {multi: true}, err => {
			if(err) {
				winston.error("Failed to start message counter");
			} else {
				function clearMessageCount() {
					db.servers.update({}, {messages_today: 0}, {multi: true}).exec();
				}
				clearMessageCount();
				setInterval(clearMessageCount, 86400000);
			}
			countServerStats(0);
		});
	}

	// Count a server's stats (games, clearing, etc.);
	function countServerStats(i) {
		if(i<bot.guilds.length) {
			var svr = bot.guilds[i];
			db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
				if(!err && serverDocument) {
					// Clear stats for server if older than a week
					if((Date.now() - serverDocument.stats_timestamp)>604800000) {
						clearStats(svr, serverDocument, () => {
							// Next server
							countServerStats(++i);
						});
					} else {
						// Iterate through all members
						svr.members.forEach(member => {
							if(member.id!=bot.user.id && !member.user.bot) {
								// If member is playing game, add 1 (equal to five minutes) to game tally
								var game = bot.getGame(member.user);
								if(game && member.user.status=="online") {
									var gameDocument = serverDocument.games.id(game);
									if(!gameDocument) {
										serverDocument.games.push({_id: game});
										gameDocument = serverDocument.games.id(game);
									}
									gameDocument.time_played++;
								}

								// Kick member if they're inactive and autokick is on
								var memberDocument = serverDocument.members.id(member.id);
								if(memberDocument && serverDocument.config.moderation.isEnabled && serverDocument.config.moderation.autokick_members.isEnabled && (Date.now() - memberDocument.last_active)>serverDocument.config.moderation.autokick_members.max_inactivity && !memberDocument.cannotAutokick && bot.getUserBotAdmin(svr, serverDocument, member)==0) {
									member.kick().then(() => {
										winston.info("Kicked member '" + member.user.username + "' due to inactivity on server '" + svr.name + "'", {svrid: svr.id, usrid: member.id});
									}).catch(err => {
										memberDocument.cannotAutokick = true;
										winston.error("Failed to kick member '" + member.user.username + "' due to inactivity on server '" + svr.name + "'", {svrid: svr.id, usrid: member.id}, err);
									});
								}
							}
						});

						// Save changes to serverDocument
						serverDocument.save(err => {
					    	if(err) {
					    		winston.error("Failed to save server data for stats", {svrid: svr.id});
					    	}

					    	// Next server
					    	countServerStats(++i);
					    });
					}
				}
			});
		} else {
			// Do this again in 15 minutes
			setTimeout(() => {
				countServerStats(0);
			}, 900000);
		}
	}

	// Clear stats for server if older than a week
	function clearStats(svr, serverDocument, callback) {
		if(serverDocument.config.points.isEnabled && svr.members.length>2) {
			// Rank members by activity score for the week
			var topMembers = [];
	        for(var i=0; i<serverDocument.members.length; i++) {
	            var member = svr.members.find("id", serverDocument.members[i]._id);
	            if(member && member.id!=bot.user.id && !member.user.bot) {
	            	var activityScore = serverDocument.members[i].messages + (serverDocument.members[i].voice*10);
		            topMembers.push([member, activityScore]);
		            serverDocument.members[i].rank_score += activityScore / 10;
		            serverDocument.members[i].rank = bot.checkRank(winston, svr, serverDocument, member, serverDocument.members[i], true);
		            serverDocument.members[i].messages = 0;
		            serverDocument.members[i].voice = 0;
	            }
	        }
	        topMembers.sort((a, b) => {
	            return a[1] - b[1];
	        });

	        // Award points to top 3
	        function awardPoints(member, amount) {
	        	db.users.findOrCreate({_id: member.id}, (err, userDocument) => {
	        		if(!err && userDocument) {
		                userDocument.points += amount;
	        		} else {
	        			winston.error("Failed to create user data to award activity points on server '" + svr.name + "'", {usrid: member.id});
	        		}
	        	});

	        }
	        for(var i=topMembers.length-1; i>topMembers.length-4; i--) {
	            if(i>=0) {
	                awardPoints(topMembers[i][0], Math.ceil(topMembers[i][1] / 10));
	            }
	        }
	    }

	    // Reset game and message data
	    serverDocument.games = [];
	    serverDocument.commands = {};

	    // Save changes to serverDocument
	    serverDocument.save(err => {
	    	if(err) {
	    		winston.error("Failed to clear stats for server '" + svr.name + "'", {svrid: svr.id});
	    	} else {
	    		winston.info("Cleared stats for server '" + svr.name + "'", {svrid: svr.id});
	    	}
	    	callback();
	    });
	}

	// Set existing reminders to send message when they expire
	function setReminders() {
		db.users.find({reminders: {$not: {$size: 0}}}, (err, userDocuments) => {
			if(err) {
				winston.error("Failed to get reminders", err);
			} else {
				for(var i=0; i<userDocuments.length; i++) {
					for(var j=0; j<userDocuments[i].reminders.length; j++) {
						setReminder(bot, winston, userDocuments[i]._id, userDocuments[i].reminders[j]);
					}
				}
			}
			setCountdowns();
		});
	}

	// Set existing countdowns in servers to send message when they expire
	function setCountdowns() {
		db.servers.find({"config.countdown_data": {$not: {$size: 0}}}, (err, serverDocuments) => {
			if(err) {
				winston.error("Failed to get countdowns", err);
			} else {
				for(var i=0; i<serverDocuments.length; i++) {
					for(var j=0; j<serverDocuments[i].countdown_data.length; j++) {
						setCountdown(bot, winston, serverDocuments[i]._id, serverDocuments[i].countdown_data[j]);
					}
				}
			}
			startStreamingRSS();
			startMessageOfTheDay();
		});
	}

	// Start streaming RSS timer
	function startStreamingRSS() {
		db.servers.find({}, (err, serverDocuments) => {
			if(!err && serverDocuments) {
				function sendStreamingRSSToServer(i) {
					if(i<serverDocuments.length) {
						var serverDocument = serverDocuments[i];
						var svr = bot.guilds.find("id", serverDocument._id);
						if(svr) {
							function sendStreamingRSSFeed(j) {
								if(j<serverDocument.config.rss_feeds.length) {
									if(serverDocument.config.rss_feeds[j].streaming.isEnabled) {
										sendStreamingRSSUpdates(bot, winston, svr, serverDocuments[i].config.rss_feeds[j], () => {
											sendStreamingRSSFeed(++j);
										});
									}
								} else {
									sendStreamingRSSToServer(++i);
								}
							}
							sendStreamingRSSFeed(0);
						}
					} else {
						setTimeout(() => {
							sendStreamingRSSToServer(0);
						}, 600000);
					}
				}
			}
		});
	}

	// Start message of the day timer
	function startMessageOfTheDay() {
		db.servers.find({"config.message_of_the_day.isEnabled": true}, (err, serverDocuments) => {
			if(err) {
				winston.error("Failed to find server data for message of the day", err);
			} else {
				for(var i=0; i<serverDocuments.length; i++) {
					var svr = bot.guilds.find("id", serverDocuments[i]._id);
					if(svr) {
						sendMessageOfTheDay(bot, winston, svr, serverDocuments[i].config.message_of_the_day);
					}
				}
			}
			runTimerExtensions();
		});
	}

	// Start all timer extensions (third-party)
	function runTimerExtensions() {
		db.servers.find({"config.extensions": {$not: {$size: 0}}}, (err, serverDocuments) => {
			if(err) {
				winston.error("Failed to find server data to start timer extensions", err);
			} else {
				for(var i=0; i<serverDocuments.length; i++) {
					var svr = bot.guilds.find("id", serverDocuments[i]._id);
					if(svr) {
						for(var j=0; j<serverDocuments[i].config.extensions.length; j++) {
							if(serverDocuments[i].config.extensions[j].type=="timer") {
								setTimeout(() => {
									runTimerExtension(svr, serverDocuments[i].config.extensions[j]);
								}, (extensionDocument.last_run + extensionDocument.interval) - Date.now());
							}
						}
					}
				}
			}
			openWebInterface();
		});

		function runTimerExtension(svr, extensionDocument) {
			for(var i=0; i<extensionDocument.enabled_channel_ids.length; i++) {
				var ch = svr.channels.find("id", extensionDocument.enabled_channel_ids[i]);
				if(ch) {
					runExtension(bot, winston, svr, ch, extensionDocument);
				}
			}
			setTimeout(() => {
				runTimerExtension(svr, extensionDocument);
			}, extensionDocument.interval);
		}
	}

	// Start listening on web interface
	function openWebInterface() {
		webserver.open(winston, config.server_port, config.server_ip);
		winston.info("Started the best Discord bot, version " + bot.version + "\n\
     _                                         ____        _   \n\
    / \\__      _____  ___  ___  _ __ ___   ___| __ )  ___ | |_ \n\
   / _ \\ \\ /\\ / / _ \\/ __|/ _ \\| '_ ` _ \\ / _ \\  _ \\ / _ \\| __|\n\
  / ___ \\ V  V /  __/\\__ \\ (_) | | | | | |  __/ |_) | (_) | |_ \n\
 /_/   \\_\\_/\\_/ \\___||___/\\___/|_| |_| |_|\\___|____/ \\___/ \\__|\n\
                                                               \n");
	}
};
