// Set defaults for new server document
module.exports = (bot, svr, serverDocument) => {
	// Default admin roles
	var rolesOfOwner = svr.owner.roles.sort((a, b) => {
		return a.position - b.position;
	});
	if(rolesOfOwner[0] && rolesOfOwner[0].name!="@everyone") {
		serverDocument.config.admins.push({
			_id: rolesOfOwner[0].id,
			level: 3
		});
	}
	svr.roles.forEach(role => {
		if(role.name!="@everyone" && role.hasPermission("MANAGE_GUILD") && !serverDocument.config.admins.id(role.id)) {
			serverDocument.config.admins.push({
				_id: role.id,
				level: 3
			});
		}
	});

	// Default RSS feed
	serverDocument.config.rss_feeds.push({
		_id: "gnews",
		url: "https://news.google.com/news?ned=us&topic=h&output=rss"
	});

	// Default tag list
	serverDocument.config.tags.list.push({
	    _id: "shrug",
	    content: "¯\\\_(ツ)_/¯"
	}, {
	    _id: "lenny",
	    content: "( ͡° ͜ʖ ͡°)"
	}, {
	    _id: "raiseyourdongers",
	    content: "ヽ༼ຈل͜ຈ༽ﾉ Raise Your Dongers ヽ༼ຈل͜ຈ༽ﾉ"
	}, {
	    _id: "praisehelix",
	    content: "つ ◕_◕ ༽つ PRAISE HELIX༼つ ◕_◕ ༽つ"
	}, {
	    _id: "goodshit",
	    content: "👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌there👌👌👌 right✔there ✔✔if i do ƽaү so my self 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠOOOOOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit"
	}, {
	    _id: "creepylenny",
	    content: "┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴"
	}, {
	    _id: "kawaii",
	    content: "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧"
	}, {
	    _id: "yeeaah",
	    content: "(•_•) ( •_•)>⌐■-■ (⌐■_■)"
	}, {
	    _id: "lod",
	    content: "ಠ_ಠ"
	}, {
	    _id: "orly",
	    content: "﴾͡๏̯͡๏﴿ O'RLY?"
	}, {
	    _id: "ayy",
	    content: "(☞ﾟ∀ﾟ)☞"
	}, {
	    _id: "gib",
	    content: "༼ つ ◕_◕ ༽つ"
	}, {
	    _id: "kawaiidog",
	    content: "(ᵔᴥᵔ)"
	}, {
	    _id: "fite",
	    content: "(ง'̀-'́)ง"
	}, {
	    _id: "kawaiimeh",
	    content: " ╮ (. ❛ ᴗ ❛.) ╭"
	}, {
	    _id: "evilsmiley",
	    content: "“ψ(｀∇´)ψ"
	}, {
	    _id: "rip",
	    content: "(✖╭╮✖)"
	}, {
	    _id: "wink",
	    content: "ಠ‿↼"
	});

	// Send message to server owner about AwesomeBot
	bot.messageBotAdmins(svr, serverDocument, "Hello! " + bot.user.username + " (that's me) has been added to " + svr.name + ", a server of yours! " + (bot.guilds.size % 1000==0 ? ("*Wow, you're server #" + bot.guilds.size + " for me!* ") : "") + "Use `" + bot.getCommandPrefix(svr, serverDocument) + "help` to learn more or check out https://awesomebot.xyz/ :slight_smile: :tada:");

	return serverDocument;
};