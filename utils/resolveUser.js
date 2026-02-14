const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000;

async function resolveUser(userId) {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.ts < USER_CACHE_TTL) return cached.data;

    // Placeholder until Hydraulisc API is wired
    const data = { uid: userId, username: `User#${userId}`, ownPfp: null };
    userCache.set(userId, { data, ts: Date.now() });
    return data;
}

module.exports = { resolveUser };
