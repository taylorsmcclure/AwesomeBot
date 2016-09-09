const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const jsonSessionStore = require("express-session-json")(session);
const passport = require("passport");
const discordStrategy = require("passport-discord").Strategy;
const fs = require("fs");
const showdown = require("showdown");
const md = new showdown.Converter();
md.setOption("tables", true);
const removeMd = require("remove-markdown");

const config = require("./../Configuration/config.json");
const auth = require("./../Configuration/auth.json");
const prettyDate = require("./../Modules/PrettyDate.js");
const secondsToString = require("./../Modules/PrettySeconds.js");

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));
app.engine("ejs", ejs.renderFile);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

const discordOAuthScopes = ["identify", "guilds"];
passport.use(new discordStrategy({
    clientID: auth.platform.client_id,
    clientSecret: auth.platform.client_secret,
    callbackURL: config.hosting_url + "login/callback",
    scope: discordOAuthScopes
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        return done(null, profile);
    });
}));
passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser((user, done) => {
	done(null, user);
});
app.use(session({
    secret: "vFEvmrQl811q2E8CZelg4438l9YFwAYd",
    resave: false,
    saveUninitialized: false,
    store: new jsonSessionStore({
    	filename: "web-sessions.json",
    	path: "./Configuration/"
    })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

module.exports = {
	initialize: (bot, db, winston) => {
		// Landing page
		app.get("/", (req, res) => {
			res.render("pages/landing.ejs", {
				authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
				rawServerCount: bot.guilds.size,
				roundedServerCount: Math.floor(bot.guilds.size/100)*100,
				rawUserCount: bot.users.size,
				rawUptime: secondsToString(process.uptime()).slice(0, -1),
				roundedUptime: Math.floor((process.uptime()/(1000*60*60))%24)
			});
		});

		// Activity page (servers, profiles, etc.)
		app.get("/activity", (req, res) => {
			db.servers.aggregate({
				$group: {
			        _id: null,
			        total: {
			        	$sum: {
			        		$add: ["$messages_today"]
			        	}
			        }
			    }
			}, (err, result) => {
				var messageCount = 0;
				if(!err && result) {
					messageCount = result[0].total;
				}
				db.servers.find({
					$where: "this.messages_today > 0"
				}, (err, serverDocuments) => {
					var activeServers = bot.guilds.size;
					if(!err && serverDocuments) {
						activeServers = serverDocuments.length;
					}
					res.render("pages/activity.ejs", {
						authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
						rawServerCount: bot.guilds.size,
						rawUserCount: bot.users.size,
						rawUptime: secondsToString(process.uptime()).slice(0, -1),
						roundedUptime: Math.floor((process.uptime()/(1000*60*60))%24),
						updatedPrettyDate: prettyDate(new Date()),
						totalMessageCount: messageCount,
						numActiveServers: activeServers
					});
				});
			});
		});

		// Server list for activity page
		app.get("/servers", (req, res) => {
			var findCriteria = {
				"config.public_data.isShown": true
			};
			if(req.query.category!="All") {
				findCriteria["config.public_data.server_listing.category"] = req.query.category;
			}
			if(req.query.publiconly=="true") {
				findCriteria["config.public_data.server_listing.isEnabled"] = true;
			}
			db.servers.find(findCriteria).exec((err, serverDocuments) => {
				var serverData = [];
				var query = req.query.q.toLowerCase();
				for(var i=0; i<serverDocuments.length; i++) {
					var svr = bot.guilds.find("id", serverDocuments[i]._id);
					if(svr) {
						var data = {
							name: svr.name,
							id: svr.id,
							icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png",
							owner: {
								username: svr.owner.user.username,
								id: svr.owner.id,
								avatar: svr.owner.user.avatarURL || "http://i.imgur.com/fU70HJK.png",
								name: svr.owner.nickname || svr.owner.user.username
							},
							members: svr.members.size,
							messages: serverDocuments[i].messages_today,
							created: Math.ceil((new Date() - svr.creationDate)/86400000),
							command_prefix: bot.getCommandPrefix(svr, serverDocuments[i]),
							category: serverDocuments[i].config.public_data.server_listing.category,
							description: serverDocuments[i].config.public_data.server_listing.isEnabled ? (md.makeHtml(serverDocuments[i].config.public_data.server_listing.description || "No description provided.")) : null,
							invite_link: serverDocuments[i].config.public_data.server_listing.isEnabled ? (serverDocuments[i].config.public_data.server_listing.invite_link || "javascript:alert('Invite link not available');") : null
						};
						if(query && data.name.toLowerCase().indexOf(query)==-1 && data.id!=query && data.owner.username.toLowerCase().indexOf(query)==-1 && (!data.description || data.description.toLowerCase().indexOf(query)==-1)) {
							continue;
						} else {
							serverData.push(data);
						}
					}
				}
				serverData.sort((a, b) => {
					switch(req.query.sort) {
						case "messages-asc":
							return a.messages - b.messages;
						case "messages-des":
							return b.messages - a.messages;
						case "alphabetical-asc":
							return a.name.localeCompare(b.name);
						case "alphabetical-des":
							return b.name.localeCompare(a.name);
						case "owner-asc":
							return a.owner.username.localeCompare(b.owner.username);
						case "owner-des":
							return b.owner.username.localeCompare(a.owner.username);
						case "members-asc":
							return a.members - b.members;
						case "members-des":
							return b.members - a.members;
						case "created-asc":
							return a.created - b.created;
						case "created-des":
							return b.created - a.created;
					}
				});
				var startItem = parseInt(req.query.count) * (parseInt(req.query.page) - 1);
				res.render("partials/servers-section.ejs", {
					serverData: serverData.slice(startItem, startItem + (req.query.count=="0" ? serverData.length : parseInt(req.query.count))),
					selectedCategory: req.query.category,
					isPublicOnly: req.query.publiconly,
					sortOrder: req.query.sort,
					itemsPerPage: req.query.count,
					currentPage: req.query.page,
					numPages: Math.ceil(bot.guilds.size/((req.query.count=="0" ? bot.guilds.size : parseInt(req.query.count)))),
					activeSearchQuery: req.query.q
				});
			});
		});

		// Server list provider for typeahead
		app.get("/serverlist", (req, res) => {
			var servers = bot.guilds.map(svr => {
				return svr.name;
			});
			servers.sort();
			res.json(servers);
		});

		// User profiles for activity page
		app.get("/users", (req, res) => {
			var userProfile;
			if(req.query.q) {
				var usr = findQueryUser(req.query.q, bot.users);
				if(usr) {
					userProfile = {
						username: usr.username,
						discriminator: usr.discriminator,
						avatar: usr.avatarURL || "http://i.imgur.com/fU70HJK.png",
						id: usr.id,
						status: usr.status,
						game: bot.getGame(usr),
						created: prettyDate(usr.creationDate),
						roundedAccountAge: Math.ceil((new Date() - usr.creationDate)/86400000),
						rawAccountAge: secondsToString((new Date() - usr.creationDate)/1000),
						mutualServers: []
					};
					switch(usr.status) {
						case "online":
							userProfile.statusColor = "is-success";
							break;
						case "idle":
						case "away":
							userProfile.statusColor = "is-warning";
							break;
						case "offline":
						default:
							userProfile.statusColor = "is-dark";
							break;
					}
				}
			}
			db.users.find({}, (err, userDocuments) => {
				var totalPoints = 0;
				var publicProfilesCount = 0;
				var reminderCount = 0;
				var profileFieldCount = 0;
				var afkUserCount = 0;
				if(!err && userDocuments) {
					for(var i=0; i<userDocuments.length; i++) {
						totalPoints += userDocuments[i].points;
						if(userDocuments[i].isProfilePublic) {
							publicProfilesCount++;
						}
						reminderCount += userDocuments[i].reminders.length;
						if(userDocuments[i].profile_fields) {
							profileFieldCount += Object.keys(userDocuments[i].profile_fields).length;
						}
						if(userDocuments[i].afk_message) {
							afkUserCount++;
						}
						if(userProfile && userDocuments[i]._id==userProfile.id) {
							userProfile.backgroundImage = userDocuments[i].profile_background_image || "http://i.imgur.com/8UIlbtg.jpg";
							userProfile.points = userDocuments[i].points;
							userProfile.rawLastSeen = secondsToString(Math.floor(((Date.now() - userDocuments[i].last_seen)/1000)/60)*60);
							userProfile.lastSeen = prettyDate(new Date(userDocuments[i].last_seen));
							var mutualServers = bot.guilds.filter(svr => {
								return svr.members.exists("id", userProfile.id);
							});
							userProfile.mutualServerCount = mutualServers.size;
							userProfile.pastNameCount = userDocuments[i].past_names.length;
							userProfile.isAfk = userDocuments[i].afk_message!=null && userDocuments[i].afk_message!="";
							if(userDocuments[i].isProfilePublic) {
								userProfile.profileFields = userDocuments[i].profile_fields;
								userProfile.pastNames = userDocuments[i].past_names;
								userProfile.afkMessage = userDocuments[i].afk_message;
								mutualServers.forEach(svr => {
									userProfile.mutualServers.push({
										name: svr.name,
										id: svr.id,
										icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png",
										owner: svr.owner.user.username
									});
								});
							}
						}
					}
				}
				if(userProfile && userProfile.points==null) {
					userProfile.points = 0;
				}
				res.render("partials/users-section.ejs", {
					activeSearchQuery: req.query.q,
					userProfile: userProfile,
					totalPoints: totalPoints,
					publicProfilesCount: publicProfilesCount,
					reminderCount: reminderCount,
					profileFieldCount: profileFieldCount,
					afkUserCount: afkUserCount,
				});
			});
		});

		// User list provider for typeahead
		app.get("/userlist", (req, res) => {
			if(req.query.svrid) {
				checkAuth(req, res, (usr, svr) => {
					res.json(getUserList(svr.members.map(member => {
						return member.user;
					})));
				});
			} else {
				res.json(getUserList(bot.users));
			}
		});

		// Wiki page (documentation)
		app.get("/wiki", (req, res) => {
			var wikiPages = []
			fs.readdir(__dirname + "/../Wiki/", (err, items) => {
				res.render("pages/wiki.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					pageList: items
				});
			});
		});

		// Wiki page parser (MD -> HTML)
		app.get("/wikipage", (req, res) => {
			if(req.query.q) {
				var query = req.query.q.toLowerCase();
				fs.readdir(__dirname + "/../Wiki/", (err, items) => {
					var wikiResults = [];
					for(var i=0; i<items.length; i++) {
						var wikiContent = removeMd(fs.readFileSync(__dirname + "/../Wiki/" + items[i], "utf8"));
						var pageTitle = items[i].substring(0, items[i].indexOf("."));
						var contentMatch = wikiContent.toLowerCase().indexOf(query);
						if(pageTitle.toLowerCase().indexOf(query)>-1 || contentMatch>-1) {
							var startIndex = contentMatch<300 ? 0 : (contentMatch - 300);
							var endIndex = contentMatch>wikiContent.length-300 ? wikiContent.length : (contentMatch + 300);
							wikiResults.push({
								pageTitle: pageTitle,
								matchText: wikiContent.substring(startIndex, contentMatch) + "<strong>" + query + "</strong>" + wikiContent.substring(contentMatch + query.length, endIndex)
							});
						}
					}
					res.render("partials/wiki-search-results.ejs", {
						wikiResults: wikiResults
					});
				});
			} else {
				fs.readFile(__dirname + "/../Wiki/" + req.query.title + ".md", "utf8", (err, data) => {
					if(err) {
						res.redirect("/error");
					} else {
						res.send(md.makeHtml(data));
					}
				});
			}
		});

		// Login to admin console
		app.get("/login", passport.authenticate("discord", {
			scope: discordOAuthScopes
		}));

		// Callback for Discord OAuth2
		app.get("/login/callback", passport.authenticate("discord", {
			failureRedirect: "/error"
		}), (req, res) => {
			res.redirect("/dashboard");
		});

		// Check authentication for console
		function checkAuth(req, res, next) {
			if(req.isAuthenticated()) {
				var usr = bot.users.find("id", req.user.id);
				if(usr) {
					if(req.query.svrid=="maintainer") {
						if(config.maintainers.indexOf(req.user.id)>-1) {
							next(usr);
						} else {
							res.redirect("/dashboard");
						}
					} else {
						var svr = bot.guilds.find("id", req.query.svrid);
						var serverDocument;
						if(svr && usr) {
							db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
								if(!err && serverDocument) {
									var member = svr.member(usr);
									if(bot.getUserBotAdmin(svr, serverDocument, member)==3) {
										next(member, svr, serverDocument);
									} else {
										res.redirect("/dashboard");
									}
								} else {
									res.redirect("/error");
								}
							});
						} else {
							res.redirect("/error");
						}
					}
				} else {
					res.redirect("/error");
				}
			} else {
				res.redirect("/login");
			}
		}

		// Admin console dashboard
		app.get("/dashboard", (req, res) => {
			if(!req.isAuthenticated()) {
				res.redirect("/login");
			} else {
				var serverData = [];
				var usr = bot.users.find("id", req.user.id);
				function addServerData(i, callback) {
					if(i<req.user.guilds.length) {
						var svr = bot.guilds.find("id", req.user.guilds[i].id);
						var data = {
							name: req.user.guilds[i].name,
							id: req.user.guilds[i].id,
							icon: req.user.guilds[i].icon ? ("https://cdn.discordapp.com/icons/" + req.user.guilds[i].id + "/" + req.user.guilds[i].icon + ".jpg") : "http://i.imgur.com/fU70HJK.png",
							botJoined: svr!=null,
							isAdmin: false
						};
						if(svr && usr) {
							db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
								if(!err && serverDocument) {
									var member = svr.member(usr);
									if(bot.getUserBotAdmin(svr, serverDocument, member)==3) {
										data.isAdmin = true;
										serverData.push(data);
										addServerData(++i, callback);
									}
								}
							});
						} else {
							serverData.push(data);
							addServerData(++i, callback);
						}
					} else {
						callback();
					}
				}
				addServerData(0, () => {
					serverData.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});
					if(config.maintainers.indexOf(req.user.id)>-1) {
						serverData.push({
							name: "Maintainer Console",
							id: "maintainer",
							icon: "/img/transparent.png",
							botJoined: true,
							isAdmin: true
						});
					}
					res.render("pages/dashboard.ejs", {
						authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
						serverData: serverData,
						rawJoinLink: "https://discordapp.com/oauth2/authorize?&client_id=" + auth.platform.client_id + "&scope=bot&permissions=470019135"
					});
				});
			}
		});

		// Admin console overview (home)
		app.get("/dashboard/overview", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				// Redirect to maintainer console if necessary
				if(!svr) {
					res.redirect("/dashboard/maintainer?svrid=maintainer");
				} else {
					var topCommand;
					var topCommandUsage = 0;
					for(var cmd in serverDocument.command_usage) {
						if(serverDocument.command_usage[cmd]>topCommandUsage) {
							topCommand = cmd;
							topCommandUsage = serverDocument.command_usage[cmd];
						}
					}
					var topMemberID = serverDocument.members.sort((a, b) => {
						return b.messages - a.messages;
					})[0];
					var topMember = svr.members.find("id", topMemberID ? topMemberID._id : null);
					var memberIDs = svr.members.map(a => {
						return a.id;
					});
					db.users.find({
						_id: {
							"$in": memberIDs
						}
					}).sort({
						points: -1
					}).limit(1).exec((err, userDocuments) => {
						var richestMember;
						if(!err && userDocuments) {
							richestMember = svr.members.find("id", userDocuments[0]._id);
						}
						var topGame = serverDocument.games.sort((a, b) => {
							return b.time_played - a.time_played;
						})[0];
						res.render("pages/admin-overview.ejs", {
							authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
							serverData: {
								name: svr.name,
								id: svr.id,
								icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png",
								owner: {
									username: svr.owner.user.username,
									id: svr.owner.id,
									avatar: svr.owner.user.avatarURL || "http://i.imgur.com/fU70HJK.png"
								}
							},
							currentPage: req.path,
							messagesToday: serverDocument.messages_today,
							topCommand: topCommand,
							memberCount: svr.members.size,
							topMember: topMember ? {
								username: topMember.user.username,
								id: topMember.id,
								avatar: topMember.user.avatarURL || "http://i.imgur.com/fU70HJK.png"
							} : null,
							topGame: topGame ? topGame._id : null,
							richestMember: richestMember ? {
								username: richestMember.user.username,
								id: richestMember.id,
								avatar: richestMember.user.avatarURL || "http://i.imgur.com/fU70HJK.png"
							} : null
						});
					});
				}
			});
		});

		// TEMPORARY form submission handler
		app.post("/uc-submit", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				console.log(req.body);
				res.redirect(req.query.path + "?svrid=" + req.query.svrid);
			});
		});

		// Admin console command options
		app.get("/dashboard/commands/command-options", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-command-options.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					currentPage: req.path,
					configData: {
						command_cooldown: serverDocument.config.command_cooldown,
						command_fetch_properties: serverDocument.config.command_fetch_properties,
						command_prefix: bot.getCommandPrefix(svr, serverDocument),
						delete_command_messages: serverDocument.config.delete_command_messages
					}
				});
			});
		});

		// Admin console command list
		app.get("/dashboard/commands/command-list", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-command-list.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					currentPage: req.path,
					configData: {
						commands: serverDocument.toObject().config.commands
					},
					commandDescriptions: config.command_descriptions
				});
			});
		});

		// Admin console RSS feeds
		app.get("/dashboard/commands/rss-feeds", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-rss-feeds.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					currentPage: req.path,
					configData: {
						rss_feeds: serverDocument.toObject().config.rss_feeds,
						commands: {
							music: {
								isEnabled: serverDocument.config.commands.music.isEnabled
							},
							trivia: {
								isEnabled: serverDocument.config.commands.trivia.isEnabled
							}
						}
					}
				});
			});
		});

		// Admin console tags
		app.get("/dashboard/commands/tags", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				var data = {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					currentPage: req.path,
					configData: {
						tags: serverDocument.toObject().config.tags,
						commands: {
							music: {
								isEnabled: serverDocument.config.commands.music.isEnabled
							},
							tag: serverDocument.config.commands.tag,
							trivia: {
								isEnabled: serverDocument.config.commands.trivia.isEnabled
							}
						}
					},
					commandDescriptions: {
						tag: config.command_descriptions.tag
					}
				};
				function cleanTag(content) {
                    var cleanContent = "";
                    while(content.indexOf("<")>-1) {
                        cleanContent += content.substring(0, content.indexOf("<"));
                        content = content.substring(content.indexOf("<")+1);
                        if(content && content.indexOf(">")>1) {
                            var type = content.charAt(0);
                            var id = content.substring(1, content.indexOf(">"));
                            if(!isNaN(id)) {
                                if(type=='@') {
                                    var usr = svr.members.find("id", id);
                                    if(usr) {
                                        cleanContent += "<b>@" + usr.username + "</b>";
                                        content = content.substring(content.indexOf(">")+1);
                                        continue;
                                    }
                                } else if(type=='#') {
                                    var ch = svr.channels.find("id", id);
                                    if(ch) {
                                        cleanContent += "<b>#" + ch.name + "</b>";
                                        content = content.substring(content.indexOf(">")+1);
                                        continue;
                                    }
                                }
                            }
                        }
                        cleanContent += "<";
                    }
                    cleanContent += content;
                    return cleanContent;
                }
                for(var i=0; i<data.configData.tags.list.length; i++) {
                	data.configData.tags.list[i].content = cleanTag(data.configData.tags.list[i].content);
                	data.configData.tags.list[i].index = i;
                }
                data.configData.tags.list.sort((a, b) => {
            		return a._id.localeCompare(b._id);
                });
				res.render("pages/admin-tags.ejs", data);
			});
		});

		// Admin console auto translation
		app.get("/dashboard/commands/auto-translation", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				var data = {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					currentPage: req.path,
					configData: {
						translated_messages: serverDocument.toObject().config.translated_messages,
						commands: {
							music: {
								isEnabled: serverDocument.config.commands.music.isEnabled
							},
							trivia: {
								isEnabled: serverDocument.config.commands.trivia.isEnabled
							}
						}
					}
				};
				for(var i=0; i<data.configData.translated_messages.length; i++) {
					var member = svr.members.find("id", data.configData.translated_messages[i]._id) || {};
					data.configData.translated_messages[i].username = member.user.username;
					data.configData.translated_messages[i].avatar = member.user.avatarURL || "http://i.imgur.com/fU70HJK.png";
				}
				res.render("pages/admin-auto-translation.ejs", data);
			});
		});

		// Admin console trivia sets
		app.get("/dashboard/commands/trivia-sets", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-trivia-sets.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					currentPage: req.path,
					configData: {
						trivia_sets: serverDocument.toObject().config.trivia_sets,
						commands: {
							music: {
								isEnabled: serverDocument.config.commands.music.isEnabled
							},
							trivia: {
								isEnabled: serverDocument.config.commands.trivia.isEnabled
							}
						}
					}
				});
			});
		});

		// Admin console API keys
		app.get("/dashboard/commands/api-keys", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-api-keys.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					currentPage: req.path,
					configData: {
						custom_api_keys: serverDocument.toObject().config.custom_api_keys || {}
					}
				});
			});
		});

		// Admin console tag reaction
		app.get("/dashboard/commands/tag-reaction", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-tag-reaction.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					currentPage: req.path,
					configData: {
						tag_reaction: serverDocument.toObject().config.tag_reaction
					}
				});
			});
		});

		// Admin console stats collection
		app.get("/dashboard/stats-points/stats-collection", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-stats-collection.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					currentPage: req.path,
					configData: {
						commands: {
							games: serverDocument.toObject().config.commands.games,
							messages: serverDocument.toObject().config.commands.messages,
							stats: serverDocument.toObject().config.commands.stats
						}
					},
					commandDescriptions: {
						games: config.command_descriptions.games,
						messages: config.command_descriptions.messages,
						stats: config.command_descriptions.stats
					}
				});
			});
		});

		// Admin console ranks
		app.get("/dashboard/stats-points/ranks", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.render("pages/admin-ranks.ejs", {
					authUser: req.isAuthenticated() ? getAuthUser(req.user) : null,
					serverData: {
						name: svr.name,
						id: svr.id,
						icon: svr.iconURL || "http://i.imgur.com/fU70HJK.png"
					},
					channelData: getChannelData(svr),
					roleData: getRoleData(svr),
					currentPage: req.path,
					configData: {
						commands: {
							
						}
					},
					commandDescriptions: {
					}
				});
			});
		});

		// Admin console AwesomePoints
		app.get("/dashboard/stats-points/awesome-points", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console admins
		app.get("/dashboard/management/admins", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console moderation
		app.get("/dashboard/management/moderation", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console blocked
		app.get("/dashboard/management/blocked", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console muted
		app.get("/dashboard/management/muted", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console member messages
		app.get("/dashboard/management/member-messages", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console filters
		app.get("/dashboard/management/filters", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console message of the day
		app.get("/dashboard/management/message-of-the-day", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console voicetext channels
		app.get("/dashboard/management/voicetext-channels", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console roles
		app.get("/dashboard/management/roles", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console name display
		app.get("/dashboard/other/name-display", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console ongoing activities
		app.get("/dashboard/other/ongoing-activities", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console public data
		app.get("/dashboard/other/public-data", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console extensions
		app.get("/dashboard/other/extensions", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Admin console extension builder
		app.get("/dashboard/other/extension-builder", (req, res) => {
			checkAuth(req, res, (consolemember, svr, serverDocument) => {
				res.redirect("/under-construction");
			});
		});

		// Maintainer console overview
		app.get("/dashboard/maintainer", (req, res) => {
			checkAuth(req, res, consolemember => {
				res.redirect("/under-construction");
			});
		});

		// Under construction for v4
		app.get("/under-construction", (req, res) => {
			res.render("pages/uc.ejs");
		});

		// Logout of admin console
		app.get("/logout", (req, res) => {
	    	req.logout();
		    res.redirect("/activity");
		});

		// Any other requests (redirect to error page)
		app.get("*", (req, res) => {
    		res.render("pages/error.ejs");
		});
	},
	open: (winston, port, ip) => {
		app.listen(port, ip, () => {
            winston.log("info", "Opened web interface on " + ip + ":" + port);
            process.setMaxListeners(0);
        });
	}
};

function findQueryUser(query, list) {
	var usr = list.find("id", query);
	if(!usr) {
		var usernameQuery = query.split("----");
		var discriminatorQuery;
		if(usernameQuery[1] && !isNaN(usernameQuery[1]) & usernameQuery[1].length==4) {
			discriminatorQuery = usernameQuery[1];
			usernameQuery = usernameQuery[0];
		} else {
			usernameQuery = usernameQuery.join("----");
		}
		var usrs = list.findAll("username", usernameQuery);
		if(discriminatorQuery) { 
			usr = usrs.filter(a => {
				return a.discriminator==discriminatorQuery;
			})[0];
		} else if(usrs.length>0) {
			usr = usrs[0];
		}
	}
	return usr;
}

function getUserList(list) {
	return list.filter(usr => {
		return usr.bot==false;
	}).map(usr => {
		return usr.username + "#" + usr.discriminator;
	}).sort();
}

function getChannelData(svr) {
	return svr.channels.findAll("type", "text").map(ch => {
		return {
			name: ch.name,
			id: ch.id,
			position: ch.position
		};
	}).sort((a, b) => {
		return a.position - b.position;
	});
}

function getRoleData(svr) {
	return svr.roles.filter(role => {
		return role.name!="@everyone" && role.name.indexOf("color-")!=0;
	}).map(role => {
		return {
			name: role.name,
			id: role.id,
			color: role.hexColor,
			position: role.position
		};
	}).sort((a, b) => {
		return a.position - b.position;
	});
}

function getAuthUser(user) {
	return {
		username: user.username,
		id: user.id,
		avatar: user.avatar ? ("https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".jpg") : "http://i.imgur.com/fU70HJK.png"
	};
}