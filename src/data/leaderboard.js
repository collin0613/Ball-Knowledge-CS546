import { users } from '../config/mongoCollections.js';

export const getLeaderboard = async () => {
    const userCollection = await users();
    const leaderboard = await userCollection
        .find({})
        .sort({ mmr: -1 })
        .limit(10)
        .toArray();
    
    return leaderboard.map(user => ({
        username: user.username,
        mmr: user.mmr,
        rank: user.rank
    }));
    }