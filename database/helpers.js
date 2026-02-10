const crypto = require('crypto');
const db = require('./init');

// it is good practice to keep all db helper functions in here instead of doing this in api.js
// you can just import like this: const db = require('../database/helpers');
// and use the helper function like this: db.createServer()

// Servers
const createServer = db.transaction((name, ownerId, icon = null) => {
    const serverId = crypto.randomUUID();
    const channelId = crypto.randomUUID();
    const membershipId = crypto.randomUUID();

    db.prepare(
        'INSERT INTO servers (id, name, icon, owner_id) VALUES (?, ?, ?, ?)'
    ).run(serverId, name, icon, ownerId);

    db.prepare(
        'INSERT INTO channels (id, server_id, name, position) VALUES (?, ?, ?, 0)'
    ).run(channelId, serverId, 'general');

    db.prepare(
        'INSERT INTO memberships (id, server_id, user_id) VALUES (?, ?, ?)'
    ).run(membershipId, serverId, ownerId);

    return { serverId, channelId };
});

function getServer(id) {
    return db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
}

function getServersForUser(userId) {
    return db.prepare(
        `SELECT s.* FROM servers s
         JOIN memberships m ON m.server_id = s.id
         WHERE m.user_id = ?
         ORDER BY s.created_at`
    ).all(userId);
}

function deleteServer(id, userId) {
    const result = db.prepare(
        'DELETE FROM servers WHERE id = ? AND owner_id = ?'
    ).run(id, userId);
    return result.changes > 0;
}

// Channels
function createChannel(serverId, name) {
    const id = crypto.randomUUID();
    const maxPos = db.prepare(
        'SELECT COALESCE(MAX(position), -1) AS max FROM channels WHERE server_id = ?'
    ).get(serverId).max;

    db.prepare(
        'INSERT INTO channels (id, server_id, name, position) VALUES (?, ?, ?, ?)'
    ).run(id, serverId, name, maxPos + 1);

    return { id, server_id: serverId, name, position: maxPos + 1 };
}

function getChannelsForServer(serverId) {
    return db.prepare(
        'SELECT * FROM channels WHERE server_id = ? ORDER BY position'
    ).all(serverId);
}

function deleteChannel(id) {
    const result = db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    return result.changes > 0;
}

function getChannel(id) {
    return db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
}

// Messages
function createMessage(channelId, userId, content) {
    const id = crypto.randomUUID();
    db.prepare(
        'INSERT INTO messages (id, channel_id, user_id, content) VALUES (?, ?, ?, ?)'
    ).run(id, channelId, userId, content);
    return { id, channel_id: channelId, user_id: userId, content };
}

function getMessages(channelId, limit = 50, before = null) {
    limit = Math.min(Math.max(1, limit), 50);
    if (before) {
        return db.prepare(
            `SELECT * FROM messages
             WHERE channel_id = ? AND created_at < (SELECT created_at FROM messages WHERE id = ?)
             ORDER BY created_at DESC LIMIT ?`
        ).all(channelId, before, limit);
    }
    return db.prepare(
        'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(channelId, limit);
}

function editMessage(id, userId, content) {
    const result = db.prepare(
        "UPDATE messages SET content = ?, edited_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(content, id, userId);
    return result.changes > 0;
}

function deleteMessage(id, userId) {
    const result = db.prepare(
        'DELETE FROM messages WHERE id = ? AND user_id = ?'
    ).run(id, userId);
    return result.changes > 0;
}

function deleteMessageAsOwner(id) {
    const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    return result.changes > 0;
}

function getMessage(id) {
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

// Memberships
function joinServer(serverId, userId) {
    const id = crypto.randomUUID();
    try {
        db.prepare(
            'INSERT INTO memberships (id, server_id, user_id) VALUES (?, ?, ?)'
        ).run(id, serverId, userId);
        return true;
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return false;
        throw err;
    }
}

function leaveServer(serverId, userId) {
    const result = db.prepare(
        'DELETE FROM memberships WHERE server_id = ? AND user_id = ?'
    ).run(serverId, userId);
    return result.changes > 0;
}

function getMembers(serverId) {
    return db.prepare(
        'SELECT * FROM memberships WHERE server_id = ? ORDER BY joined_at'
    ).all(serverId);
}

function isMember(serverId, userId) {
    return !!db.prepare(
        'SELECT 1 FROM memberships WHERE server_id = ? AND user_id = ?'
    ).get(serverId, userId);
}

module.exports = {
    createServer,
    getServer,
    getServersForUser,
    deleteServer,
    createChannel,
    getChannelsForServer,
    deleteChannel,
    getChannel,
    createMessage,
    getMessages,
    editMessage,
    deleteMessage,
    deleteMessageAsOwner,
    getMessage,
    joinServer,
    leaveServer,
    getMembers,
    isMember,
};
