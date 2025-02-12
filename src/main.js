// Dependencies
const login = require("./login"); // Login code
const config = require("./config"); // Config file
const utils = require("./utils"); // Utility functions
const commands = require("./commands"); // Command documentation/configuration
const runner = require("./runcommand"); // For command handling code
const _ = require("./server"); // Server configuration (just needs to be loaded)
const easter = require("./easter"); // Easter eggs
let credentials;
try {
    // Login creds from local dir
    credentials = require("./credentials");
} catch (e) {
    // Deployed to Heroku or config file is missing
    credentials = process.env;
}
// External storage API (Memcachier) (requires credentials)
const mem = require("memjs").Client.create(credentials.MEMCACHIER_SERVERS, {
    "username": credentials.MEMCACHIER_USERNAME,
    "password": credentials.MEMCACHIER_PASSWORD
});
var gapi; // Global API for external functions (set on login)

// Log in
if (require.main === module) { // Called directly; login immediately
    login.login(main);
}

// Listen for commands
function main(err, api) {
    if (err) return console.error(err);
    console.log(`Successfully logged in to user account ${api.getCurrentUserID()}.`);
    gapi = api; // Initialize global API variable
    utils.setglobals(api, mem); // Initialize in utils module as well
    api.listen(handleMessage);
}

// Processes incoming messages
// Passed as callback to API's listen, but can also be called externally
// (function is exported as a part of this module)
function handleMessage(err, message, external = false, api = gapi) { // New message received from listen()
    if (message && !err) {
        // Update info of group where message came from in the background (unless it's an external call)
        if (!external && message.type == "message") {
            utils.updateGroupInfo(message.threadID, message);
        }
        // Load existing group data
        utils.getGroupInfo(message.threadID, (err, info) => {
            if (err || !info) {
                console.log(err);
            } else {
                // Handle messages
                const senderId = message.senderID;
                if (message.type == "message" && senderId != config.bot.id && !utils.isBanned(senderId, info)) { // Sender is not banned and is not the bot
                    const m = message.body;
                    const attachments = message.attachments;
                    // Handle message body
                    if (m) {
                        // Handle user pings
                        handlePings(m, senderId, info);
                        // Pass to commands testing for trigger word
                        const cindex = m.toLowerCase().indexOf(config.trigger);
                        if (cindex > -1) { // Trigger command mode
                            // Also pass full message obj in case it's needed in a command
                            handleCommand(m.substring(cindex + config.trigger.length + 1), senderId, info, message);
                        }
                        // Check for Easter eggs
                        easter.handleEasterEggs(message, senderId, attachments, info, api);
                    }
                }
            }
        });
    }
}
exports.handleMessage = handleMessage;

/*
  This is the main body of the bot; it handles whatever comes after the trigger word
  in the received message body and looks for matches of commands listed in the commands.js
  file, and then processes them accordingly.
*/
function handleCommand(command, fromUserId, groupInfo, messageLiteral, api = gapi) {
    const attachments = messageLiteral.attachments; // For commands that take attachments
    // Command preprocessing to compare command grammars against input and check for matches
    const co = commands.commands; // Short var names since I'll be typing them a lot
    for (let c in co) {
        if (co.hasOwnProperty(c)) {
            // Check whether command is sudo-protected and, if so, whether the user is the owner
            if (!co[c].sudo || (co[c].sudo && fromUserId == config.owner.id)) {
                // Set match vals
                // fromStart will concatenate a 'start of string' operator to the beginning
                // of the regular expression used to match commands if contextless grammar
                // is turned off in the config (off by default)
                let regex = Array.isArray(co[c].regex) ? co[c].regex[0] : co[c].regex;
                if (typeof regex == "string") { regex = new RegExp(regex); }
                const fromStart = config.contextless ? regex : new RegExp("^" + regex.source, regex.flags);
                if (co[c].user_input.accepts) { // Takes a match from the members dict
                    if (Array.isArray(co[c].regex)) { // Also has a regex suffix (passed as length 2 array)
                        co[c].m = utils.matchesWithUser(fromStart, command, fromUserId, groupInfo, co[c].user_input.optional, " ", co[c].regex[1]);
                    } else { // Just a standard regex prefex as a string + name
                        co[c].m = utils.matchesWithUser(fromStart, command, fromUserId, groupInfo, co[c].user_input.optional);
                    }
                } else {
                    co[c].m = command.match(fromStart);
                }
            } else { // User not authorized
                // Set match to null to prevent checking issues
                co[c].m = null;
            }
            // Update usage statistics if command is matched
            if (co[c].m) {
                utils.updateStats(c, fromUserId);
            }
        }
    }
    debugCommandOutput(false);
    // Check commands for matches & eval
    runner.run(api, co, groupInfo, fromUserId, attachments);
}
exports.handleCommand = handleCommand; // Export for external use

function debugCommandOutput(flag) {
    if (flag) {
        const co = commands.commands;
        console.log(Object.keys(co).map((c) => {
            return `${c}: ${co[c].m}`
        }));
    }
}

// Parses a sent message for pings, removes them from the message,
// and extracts the intended users from the ping to send the message to them
function parsePing(m, fromUserId, groupInfo) {
    let users = [];
    const allMatch = m.match(/@@(all|everyone|channel)/i);
    if (allMatch && allMatch[1]) { // Alert everyone
        users = Object.keys(groupInfo.members);
        // Remove sending user from recipients
        users.splice(users.indexOf(groupInfo.names[fromUserId].toLowerCase()), 1);
        m = m.split("@@" + allMatch[1]).join("");
    } else {
        let matches = utils.matchesWithUser(new RegExp("@@"), m, fromUserId, groupInfo, false, "");
        while (matches && matches[1]) {
            users.push(matches[1].toLowerCase());
            const beforeSplit = m;
            m = m.split(`@@${matches[1]}`).join(""); // Remove discovered match from string
            if (m == beforeSplit) { // Discovered match was "me" or alias
                m = m.split("@@me").join("");
                const alias = groupInfo.aliases[matches[1]];
                if (alias) {
                    m = m.split(`@@${alias}`).join("");
                }
            }
            matches = utils.matchesWithUser(new RegExp("@@"), m, fromUserId, groupInfo, false, "");
        }
        // After loop, m will contain the message without the pings (the message to be sent)
    }
    return {
        /* Return array of names to ping, but remove sending user */
        "users": users.filter(e => (e != groupInfo.names[fromUserId].toLowerCase())),
        "message": m.trim() // Remove leading/trailing whitespace
    };
}

function handlePings(msg, senderId, info) {
    const pingData = parsePing(msg, senderId, info);
    const pingUsers = pingData.users;
    const pingMessage = pingData.message;
    if (pingUsers) {
        for (let i = 0; i < pingUsers.length; i++) {
            const sender = info.nicknames[senderId] || info.names[senderId] || "A user";
            let message = `${sender} summoned you in ${info.name}`;
            if (pingMessage.length > 0) { // Message left after pings removed – pass to receiver
                message = `"${pingMessage}" – ${sender} in ${info.name}`;
            }
            message += ` at ${utils.getTimeString()}` // Time stamp
            // Send message with links to chat/sender
            utils.sendMessageWithMentions(message, [{
                "tag": sender,
                "id": senderId
            }, {
                "tag": info.name,
                "id": info.threadId
            }], info.members[pingUsers[i]]);
        }
    }
}
