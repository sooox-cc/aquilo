const express = require('express');
const router = express.Router();
const { sanitize } = require('../middleware/sanitize');
const db = require('../database/helpers');

function requireAuth(req, res, next) {
    if (!req.session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

router.use(requireAuth);

// Servers
router.post('/servers', (req, res) => {
    const name = sanitize((req.body.name || '').trim());
    if (!name || name.length > 100) return res.status(400).json({ error: 'Invalid server name' });

    const icon = req.body.icon ? sanitize(req.body.icon.trim()) : null;
    const { serverId, channelId } = db.createServer(name, req.session.user.id, icon);
    res.status(201).json({ id: serverId, channelId });
});

router.get('/servers', (req, res) => {
    const servers = db.getServersForUser(req.session.user.id);
    res.json(servers);
});

router.delete('/servers/:serverId', (req, res) => {
    const deleted = db.deleteServer(req.params.serverId, req.session.user.id);
    if (!deleted) return res.status(403).json({ error: 'Forbidden or not found' });
    res.json({ success: true });
});

// Channels
router.post('/servers/:serverId/channels', (req, res) => {
    const server = db.getServer(req.params.serverId);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    if (server.owner_id !== req.session.user.id) return res.status(403).json({ error: 'Forbidden' });

    const name = sanitize((req.body.name || '').trim());
    if (!name || name.length > 100) return res.status(400).json({ error: 'Invalid channel name' });

    const channel = db.createChannel(req.params.serverId, name);
    res.status(201).json(channel);
});

router.get('/servers/:serverId/channels', (req, res) => {
    if (!db.isMember(req.params.serverId, req.session.user.id)) {
        return res.status(403).json({ error: 'Not a member' });
    }
    const channels = db.getChannelsForServer(req.params.serverId);
    res.json(channels);
});

router.delete('/channels/:channelId', (req, res) => {
    const channel = db.getChannel(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const server = db.getServer(channel.server_id);
    if (!server || server.owner_id !== req.session.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    db.deleteChannel(req.params.channelId);
    res.json({ success: true });
});

// Messages
router.get('/channels/:channelId/messages', (req, res) => {
    const channel = db.getChannel(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (!db.isMember(channel.server_id, req.session.user.id)) {
        return res.status(403).json({ error: 'Not a member' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before || null;
    const messages = db.getMessages(req.params.channelId, limit, before);
    res.json(messages);
});

router.post('/channels/:channelId/messages', (req, res) => {
    const channel = db.getChannel(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (!db.isMember(channel.server_id, req.session.user.id)) {
        return res.status(403).json({ error: 'Not a member' });
    }

    const content = sanitize((req.body.content || '').trim());
    if (!content || content.length > 2000) {
        return res.status(400).json({ error: 'Invalid message content' });
    }

    const message = db.createMessage(req.params.channelId, req.session.user.id, content);
    res.status(201).json(message);
});

router.patch('/messages/:messageId', (req, res) => {
    const content = sanitize((req.body.content || '').trim());
    if (!content || content.length > 2000) {
        return res.status(400).json({ error: 'Invalid message content' });
    }

    const edited = db.editMessage(req.params.messageId, req.session.user.id, content);
    if (!edited) return res.status(403).json({ error: 'Forbidden or not found' });
    res.json({ success: true });
});

router.delete('/messages/:messageId', (req, res) => {
    const message = db.getMessage(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.user_id === req.session.user.id) {
        db.deleteMessage(req.params.messageId, req.session.user.id);
        return res.json({ success: true });
    }

    const channel = db.getChannel(message.channel_id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const server = db.getServer(channel.server_id);
    if (server && server.owner_id === req.session.user.id) {
        db.deleteMessageAsOwner(req.params.messageId);
        return res.json({ success: true });
    }

    res.status(403).json({ error: 'Forbidden' });
});

// Memberships
router.post('/servers/:serverId/join', (req, res) => {
    const server = db.getServer(req.params.serverId);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const joined = db.joinServer(req.params.serverId, req.session.user.id);
    if (!joined) return res.status(409).json({ error: 'Already a member' });
    res.status(201).json({ success: true });
});

router.post('/servers/:serverId/leave', (req, res) => {
    const server = db.getServer(req.params.serverId);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    if (server.owner_id === req.session.user.id) {
        return res.status(400).json({ error: 'Owner cannot leave — delete the server instead' });
    }

    const left = db.leaveServer(req.params.serverId, req.session.user.id);
    if (!left) return res.status(404).json({ error: 'Not a member' });
    res.json({ success: true });
});

module.exports = router;
