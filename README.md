# AssumeZero Bot

## About
AssumeZero Bot is a highly configurable bot that can be added to Facebook Messenger group chats. It is designed to expose features that may be hidden or made difficult to use by Messenger's UI, both on desktop and mobile. In addition to this functionality, it also connects to several different external services, like [Spotify](https://spotify.com), [Wolfram|Alpha](http://wolframalpha.com), and [OpenWeatherMap](https://openweathermap.org).

The bot was written with [Node.js](https://nodejs.org/) and the incredible [Facebook Chat API](https://github.com/Schmavery/facebook-chat-api), which allows the bot to emulate a Facebook user who can be added and removed from chats. As of this writing, Facebook's [official API](https://developers.facebook.com/docs/chat) can still only be used in one-on-one conversations.

## Usage
Most of the bot's features are activated with a "trigger word," which can be changed in [`config.js`](src/config.js). The default trigger word is "physics" and most commands will be in the form:

> physics command [options]

To see a list of commands, use:

> physics help

If you wish to use the bot's canonical instance, you can message it [here](https://www.facebook.com/assumezero.bot.3). Otherwise, you can [set up your own instance](#setup).

## Basic Commands
As a rule of thumb, the bot is capable of doing everything that a human user can do on the desktop version of Messenger. This includes messaging the chat, adding and removing users, and modifying user nicknames. Let's take a look:

![physics alive](media/docs/alive.png)

![physics add](media/docs/add.png)

![physics kick](media/docs/kick.png)

![physics rename](media/docs/rename.png)

However, being a bot comes with its own set of advantages. For example, the bot can remove a user for a certain period of time before adding them back automatically!

![physics kick (time)](media/docs/kicktime.png)

Because the bot interfaces directly with Facebook's endpoints through the Facebook Chat API, it often has access to an expanded set of abilities that are not directly available through Messenger's UI.

For instance, it can set the chat emoji to any emoji supported by Messenger rather than just those provided by the default palette.

![physics emoji](media/docs/emoji.png)

It can also query Facebook to perform searches for users, pages, and groups. This can be used to verify that the user being added via the "add" command is the one you actually want to add: the add command first performs a search for the given user that is weighted based on its Facebook-determined proximity (the "rank" in a search result) and then adds the first user to result from this query.

![physics search](media/docs/search.png)

There are plenty more commands like this, such as poll, title, and photo, but they all operate on a similar premise to these basic examples. Check out the help entries for these commands to learn more.

## Database-dependent Commands

The bot stores information about each conversation that it is a part of in its database. This information is initialized the first time it is added to a chat, so you will see this message:

![Init message](media/docs/init.png)

After this, the group's information will be continously updated in the background as it receives new messages. This means that any changes to the group's properties, such as adding/removing users, changing the title or photo, or updating the colors or emoji, will be reflected in the bot's database entry for the conversation, which allows it to stay up-to-date and use these properties when needed without the need for a blocking network call. The properties that are stored reflect only metadata about the chat, and no personal data from chat (such as message history) is stored – the exact list of things stored in the database can be viewed in [the definition of the `groupInfo` object](#under-the-hood).

As a result of this persistent storage, certain commands can store and retrieve information about the conversation and its participants.

The simplest of these is the vote command, which comes in two variants, to increase and decrease a user's globally-tracked 'score' respectively:

![physics \>](media/docs/scoreup.png)
![physics \<](media/docs/scoredown.png)

What this score indicates is arbitrary and is up to the user to decide, but regardless of its usage, the scores of any users in a group chat can be shown with the scoreboard command:

![physics scoreboard](media/docs/scoreboard.png)

Similarly, the score of a single user can be retrieved with the score command:

![physics score](media/docs/score.png)

The bot can list statistics for its usage with the stats command – this command can list aggregated data for all commands, but it also takes an optional command argument to display more specific information about a given command, including its most prolific user (if they are in the chat<sup name="link1">[1](#note1)</sup>). The data collected for these statistics does not contain any specific messages from a conversation, but rather global counts of how many times a user has triggered that command. In other words, no private data is stored.

![physics stats](media/docs/stats.png)


Now for some more interesting stuff – the playlist command interfaces with the Spotify API<sup name="link2">[2](#note2)</sup> to store playlists for each user and retrieve songs from them on command. To add a playlist to the chat, you'll need its [Spotify URI](https://support.spotify.com/us/article/sharing-music) and a user to associate it to. Once stored, the song command can be used to get a random song from it. See the help entries for these commands for more information.

![physics song](media/docs/song.png)

The bot can keep a running tab for each conversation, allowing users to keep track of any shared finances and easily split costs between them. Several child commands exist for this command:

![physics tab](media/docs/tab.png)
![physics tab add](media/docs/tabadd.png)
![physics tab split](media/docs/tabsplit.png)

Add and subtract have a default value of $1, and the split command will split between all members in the group by default, but it accepts an optional parameter to indicate how many people the tab should be split between.

Lastly, the pin command will allow you to pin a message that can be recalled later; this is useful for keeping track of something in an active chat where it would otherwise get buried.

![physics pin message](media/docs/pinset.png)
![physics pin](media/docs/pin.png)

# Fun Commands

**Note**: Several of these commands interface with external APIs that may require configuration in [`config.js`](src/config.js), but for the most part can be used with the keys I've already provided (although you may want to generate your own for each API so that we're not sharing usage limits).

These commands are pretty simple, so I'll show them without explanation and you can get more info in the help entries:

![physics xkcd](media/docs/xkcd.png)
![physics weather](media/docs/weather.png)
![physics space](media/docs/space.png)
![physics wiki](media/docs/wiki.png)
![physics wolfram](media/docs/wolfram.png)

Be careful with this one (see [Under the Hood](#under-the-hood) for safety precautions taken):

![physics execute order 66](media/docs/order66.png)

This command was a lot more interesting when Messenger's backend accepted arbitrary hex values for the group color, but it can still enumerate through all of the whitelisted colors in the palette.

![physics hit the lights](media/docs/lights.png)

This one can be pretty spammy (and can also get the Facebook account that the bot is using temporarily or permanently banned, speaking from experience). It is configurable in [`config.js`](config.js).

![physics wake up](media/docs/wake.png)

Lastly, the random message command will get a random message from the current conversation, but it is quite finnicky on Facebook's end, so YMMV.

![physics random message](media/docs/randmess.png)

# Setup

To get your own instance of the bot, you'll first need to clone this repo. Once you've done that, you'll need to do several things to set up its associated services – this project was written using Heroku for hosting (although it can be run locally) and memcache (via MemCachier) as a pseudo-database solution. The rest of these setup instructions will assume the use of these services, but the functionalities that they serve are encapsulated in wrapper functions that can be easily modified to use another solution if desired. If you decide to do this, you may wish to utilize [`config.js`](src/config.js) and read [Under the Hood](#under-the-hood).

All of the following variables need to be exported from a `credentials.js` file in the `src` directory (ideal if running locally) or exposed as environment variables (on Heroku, this can be done with config vars in the settings tab).

```js
// Facebook log-in credentials for bot account
exports.EMAIL = "";
exports.PASSWORD = "";
// Heroku application token
exports.TOKEN = "";
// MemCachier credentials (from MemCachier dashboard)
exports.MEMCACHIER_PASSWORD = "";
exports.MEMCACHIER_SERVERS = "";
exports.MEMCACHIER_USERNAME = "";
// Spotify API credentials
exports.SPOTIFY_CLIENTID = "";
exports.SPOTIFY_CLIENTSECRET = "";
// Wolfram short-answer API key
exports.WOLFRAM_KEY = "";
// Open Weather Map API key
exports.WEATHER_KEY = "";
```

Some things to note: MemCachier can be configured from Heroku add-ons, and the email and password should be for the account you want to run the bot on, which isn't necessarily your own account. If you have trouble logging in, try logging in through a browser as Facebook may occasionally lock you out for suspicious behavior – this can usually be fixed by logging in manually and completing a CAPTCHA.

You don't _need_ to set up all of these services, but if you don't, their associated commands will not be functional. At minimum however, you need to expose the email, password, and MemCachier variables for the bot to run.

# Under the Hood
At the highest level, the bot listens to a stream of messages, calling the `handleMessage` function when one is received. This function has two main tasks: (1) parse the message to determine which (more specific) handler function it should be passed to and (2) update the information associated with the group in memory. These tasks are performed in parallel, and if no information is currently stored about the thread, it is initialized in the database. The database also stores the appstate after logging in so that a hard user/password login doesn't have to be performed every time. To purge this appstate, use `make logout` or use the functions in [`login.js`](src/login.js).

There are three main types of messages to handle: pings, Easter eggs, and commands. All of the associated handling functions (`handlePings`, `handleEasterEggs`, and `handleCommand`) are available externally by requiring the main module. If a message contains a ping, the named member(s) will be notified in a private message thread with the bot. Easter eggs are a set of hidden responses from the bot that can be configured in [`easter.js`](src/easter.js). These are off by default. Commands are the main feature of the bot and comprise the majority of its codebase.

The bot's command structure is "context-free"; it doesn't care where in the message the trigger word is used and what comes before it – as a result, only the text following the trigger word is passed to the `handleCommand`. The user ID of the sender, the `groupInfo` object for the thread, and the full message object from the listener are also passed.

The `groupInfo` object is a record of the information stored in the database for a given thread, and it is passed to most utility functions used in [`main.js`](src/main.js) by `handleCommand`. Its structure changes with the internals of Facebook's message representation and the facebook-chat-api's parsing of it, but it is currently represented as follows:

```js
let groupInfo = {
    // Thread's ID (used by facebook-chat-api)
    "threadId": string,
    // Last message received in the thread
    "lastMessage": facebook_chat_api.messageObj,
    // Name of the chat (if it exists), or the names of its members separated by '/'
    "name": string,
    // The current thread emoji
    "emoji": string,
    // The URL of the current group photo
    "image": string,
    // The current thread color (as a hex string)
    "color": string,
    // A map from user IDs to nicknames
    "nicknames": {string: string},
    // An array of user IDs representing the admins of the group
    "admins": [string],
    // Whether the chat has Easter eggs muted (true by default)
    "muted": bool,
    // A map from user IDs to stored Spotify playlist objects, which have these props:
    // name, id, user, uri
    "playlists": {string: playlistObj},
    // A map from user IDs to name aliases (which can be used in commands)
    "aliases": {string: string},
    // A flag that records whether the thread is a group
    "isGroup": bool,
    // A map from first names of thread members to user IDs
    "members": {string: string},
    // A map from user IDs to first names of thread members
    "names": {string: string},
    // A regular expression that matches first names and aliases of members in the thread
    "userRegExp": string
}
```