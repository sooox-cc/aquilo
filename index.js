const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const globals = JSON.parse(fs.readFileSync('globals.json', 'utf8'));
const { version } = require('./package.json');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session configuration
app.use(session({
    secret: globals.sessionKey,
    resave: true,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
        secure: false,                  // Set to true if you use a valid SSL certificate for HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,    // 24 hours
        path: '/',
        sameSite: 'lax'                 // Added for security
    },
    rolling: true                       // Refresh session with each request
}));

// Static files and views
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Onboarding
app.get('/', async (req, res) => {
    try {
        res.render('pages/welcome', {
            username: null,
            uid: null,
            title: globals.title,
            bannerURL: globals.bannerURL,
            shortDescription: globals.shortDescription,
            kofiURL: globals.kofiURL,
            aquiloURL: globals.aquilo_invite || null
        })
    } catch(err) {
        res.render('pages/404')
    }
})

// Settings (?)
app.get('/settings', async (req, res) => {
    try {
        res.render('pages/settings', {
            username: null,
            uid: null,
            title: globals.title,
            bannerURL: globals.bannerURL,
            shortDescription: globals.shortDescription,
            kofiURL: globals.kofiURL,
            version
        })
    } catch(err) {
        res.render('pages/404')
    }
})

app.get('/register', async (req, res) => {
    const redirectTo = req.query.next && req.query.next.startsWith('/')
    ? req.query.next
    : '/';
    res.render('pages/register', {
        title: globals.title,
        next: redirectTo
    })
})

app.get('/test', async (req, res) => {
    const user = {uid: '1', username: 'SleepingAmi', ownPfp: 'https://hydraulisc.net/avatars/b7fc18398b37dcc25f21e1c2745fca7d'}
    try {
        res.render('pages/app', {
            username: user.username,
            uid: user.uid,
            ownPfp: user.ownPfp,
            title: globals.title,
            bannerURL: globals.bannerURL,
            shortDescription: globals.shortDescription,
            kofiURL: globals.kofiURL,
            servers: [],//[ { id: "server_1", icon: "https://raw.githubusercontent.com/catppuccin/catppuccin/refs/heads/main/assets/palette/circles/latte_red.png", name: "red", unread: true }, { id: "server_2", icon: "https://raw.githubusercontent.com/catppuccin/catppuccin/refs/heads/main/assets/palette/circles/latte_yellow.png", name: "yellow", unread: false }, { id: "server_3", icon: "https://raw.githubusercontent.com/catppuccin/catppuccin/refs/heads/main/assets/palette/circles/latte_green.png", name: "green", unread: false }, { id: "server_4", icon: "https://raw.githubusercontent.com/catppuccin/catppuccin/refs/heads/main/assets/palette/circles/latte_blue.png", name: "blue", unread: true }, { id: "server_5", icon: "https://raw.githubusercontent.com/catppuccin/catppuccin/refs/heads/main/assets/palette/circles/frappe_yellow.png", name: "extra", unread: true } ],
            channels: [ { id: "channel_1", name: "general", unread: true }, { id: "channel_2", name: "off-topic", unread: false }, { id: "channel_3", name: "polls", unread: false }, { id: "channel_4", name: "media", unread: true }, { id: "channel_5", name: "extra", unread: true } ],
            channelMessages: [ { id: "message_1", "user": user, content: "if you are reading this", unread: false }, { id: "message_2", "user": user, content: "then dummy test messages work", unread: false }, { id: "message_3", "user": user, content: "these messages are in reverse", unread: false }, { id: "message_4", "user": user, content: "because the database", unread: true }, { id: "message_5", "user": user, content: "doesn't exist", unread: true }, { id: "message_2", "user": user, content: "then dummy test messages work", unread: true }, { id: "message_3", "user": user, content: "these messages are in reverse", unread: true }, { id: "message_3", "user": user, content: "because the database", unread: true }, { id: "message_3", "user": user, content: "doesn't exist", unread: true }, { id: "message_2", "user": user, content: "then dummy test messages work", unread: true }, { id: "message_3", "user": user, content: "What happens if we have an asurdly long message in chat? Like, do the lines wrap, or does it go into a full overflow? I guess I'll just have to find out the hard way, typing this absurdly long message, huh? Well, that answers that.", unread: true } ]
        })
    } catch(err) {
        res.render('pages/404')
    }
})

// Start server
const PORT = globals.hostPort || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // initializeDatabase(); // Initialize the database when the server starts
});