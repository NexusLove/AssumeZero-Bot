const utils = require("./configutils"); // Utility functions

// The trigger word that precedes most commands and will activate the bot
exports.trigger = ">>";

// Bot owner information
exports.owner = {
    "names": {
        "short": "Nexus",
        "long": "NexusLove"
    },
    "id": "798227540595716" // ID of bot owner (for secure commands, reports, and alerts)
};

// Bot information
exports.bot = {
    "names": {
        "short": "HN", // Will be used as 'nickname' in chat (remove if same as account name)
        "long": "HiveNet" // Name displayed in profile on bot's Facebook account
    },
    "id": "798227540595716" // Bot's ID (for security purposes in commands)
}

// Determines whether bot grammar is "contextless"
// i.e. whether the command must match from the start of the string or anywhere within it
// If set to true, some ambiguity may be introduced and multiple command may run from a 
// single message.
exports.contextless = false;

// Default group name when no other information is available
exports.defaultTitle = "Unnamed chat"

// Heroku settings (might need to tweak some things if using another host)
// App name
exports.appName = "hivenetfb";

// Server URL
exports.serverURL = `http://${exports.appName}.herokuapp.com`;

// Whether the bot should sleep at night to preserve dyno hours
// If not, it will ping the server every 20 min to keep it awake
exports.shouldSleep = false;

// What time the bot should sleep in your timezone
exports.localSleepTime = 3;

// What time the bot should wake up in your timezone
exports.localWakeTime = 9;

// Your server's UTC offset
exports.serverUTCOffset = 5;

// Time in seconds to ban users for Order 66
exports.order66Time = 15;

// Time in seconds to ban users for violating the GIF policy
exports.banTime = 30;

// Number of times to message user with the "wake up" command
exports.wakeUpTimes = 20;

// Default color (hex)
exports.defaultColor = "#67B868";

// Number of random colors to cycle through for the "hit the lights" command
exports.numColors = 10;

// Default emoji
exports.defaultEmoji = "🚀";

// exports.banned is a list of banned user IDs as strings
// Stored in memory and pulled at runtime & after updates
// Remove this function call and replace with an array of user IDs to override
utils.getBannedUsers((err, users) => {
    if (err) {
        console.log(err);
    }
    exports.banned = users;
});

// For xkcd searching capability
// Custom search engine that searches the xkcd website only
// (keep unless you want to customize the results) and an API key
// from Google Dev Console
exports.xkcd = {
    "engine": "017207449713114446929:kyxuw7rvlw4",
    "key": "AIzaSyCHfJCpWEYUCydDMbb9PqK42XpPQd9L-F8"
};

// How many points a vote is worth by default
// See commands.js for more info
exports.votePoints = 5;

// Default playlist to use if group has no added playlists
exports.defaultPlaylist = {
    "name": "HiveNet",
    "user": "HiveNet",
    "uri": "4joxRVv8wzT4keFzCS3gAt"
};

// Number of top tracks to display for Spotify searches
exports.spotifySearchLimit = 3;

// Number of times bot will retry adding a user if it fails on the first time
exports.addBufferLimit = 5;

// List of responses for "answer" command
exports.answerResponses = ["Yes", "No", "Maybe", "It is certain", "Time will tell", "Ask again later",
    "Only if you believe", "Possibly", "Never", "Of course", "No way", "You're out of your mind", "Nope",
    "Yep", "Good one", "Eh", "Si crees", "Por supuesto", "...", "Welp"
];

// Default bounds for RNG command
exports.defaultRNGBounds = [1, 100];

// Timeout in milliseconds for functions that gather data asynchronously
exports.asyncTimeout = 5000;

// Number of chats to fetch when pulling thread history
exports.threadLimit = 50;

// For Wikipedia searching capability
// Custom search engine that searches Wikipedia only
// (keep unless you want to customize the results) and an API key
// from Google Dev Console
exports.wiki = {
    "engine": "017207449713114446929:cyipvxn5_rk",
    "key": "AIzaSyCHfJCpWEYUCydDMbb9PqK42XpPQd9L-F8"
};

// Max length of a file path (somewhat arbitrarily chosen by OS? Windows
// has limit of 260; seems to be 220 for macOS)
exports.MAXPATH = 219;

// This flag decides whether to fail silently on empty database reads
// (i.e. not send the 'hello' init message to chats not stored in the db) that result
// from the cache being periodically wiped.
//
// It works by checking whether the canonical thread (config.owner.id) has an entry
// in the database and (if not) decides that the database has been wiped and to not
// send init messages to new chats.
//
// This mode works best when paired with a cron script that will restore the database
// from a snapshot on a periodic basis in order to resolve this issue, however this is
// not necessary as it will just continue to collect new database information silently
// in the background as chats become active until the canonical thread is re-added to
// the database.
exports.dbFailSilently = true;
