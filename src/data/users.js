import { users } from '../config/mongoCollections.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

export const createUser = async (
  firstName,
  lastName,
  email,
  username,
  password,
  bio,
  profileCustomization,
  pickHistory,
  friends,
  friendRequests,
  creditBalance,
  mmr,
  rank
) => {
  // input validation
  if (!firstName || !lastName || !email || !username || !password) {
    throw 'All required fields must be provided';
  }
  
  if (typeof firstName !== 'string' || typeof lastName !== 'string' || 
      typeof email !== 'string' || typeof username !== 'string' || 
      typeof password !== 'string') {
    throw 'Invalid input types';
  }
  
  firstName = firstName.trim();
  lastName = lastName.trim();
  email = email.trim().toLowerCase();
  username = username.trim().toLowerCase();
  
  // validate inputs
  if (firstName.length < 2) throw 'First name must be at least 2 characters';
  if (lastName.length < 2) throw 'Last name must be at least 2 characters';
  if (username.length < 3) throw 'Username must be at least 3 characters';
  if (password.length < 6) throw 'Password must be at least 6 characters';
  
  // validate email format
  const hasAtSign = email.includes('@');
  const hasDotAfterAt = email.indexOf('.', email.indexOf('@')) > email.indexOf('@');

  if (!hasAtSign || !hasDotAfterAt) {
    throw 'Invalid email format';
  }
  
  // check if username or email already exists
  const userCollection = await users();
  const existingUser = await userCollection.findOne({
    $or: [
      { username: username },
      { email: email }
    ]
  });
  
  if (existingUser) {
    if (existingUser.username === username) {
      throw 'Username already exists';
    }
    if (existingUser.email === email) {
      throw 'Email already in use';
    }
  }
    
  // hash password
  const hashedPassword = await bcrypt.hash(password, 16);
  
  // create new user object
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    username: username,
    hashedPassword: hashedPassword,
    bio: bio,
    profileCustomization: {},
    pickHistory: [],
    friends: [],
    friendRequests: [], // added 5/11: friend requests received by other users. Stores as array of usernames
    creditBalance: 1000,
    mmr: 0,
    rank: 'Unranked'
  };
  
  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw 'Could not add user';
  }
  
  return {
    _id: insertInfo.insertedId,
    firstName: firstName,
    lastName: lastName,
    email: email,
    username: username
  };
};

export const getUserById = async (userId) => {
  if (!userId) throw 'You must provide an id to search for';
  if (typeof userId !== 'string') throw 'Invalid id type';
  
  const userCollection = await users();
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });
  
  if (!user) {
    throw 'No user found with that id';
  }
  
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    bio: user.bio,
    profileCustomization: user.profileCustomization,
    pickHistory: user.pickHistory,
    friends: user.friends,
    creditBalance: user.creditBalance,
    mmr: user.mmr,
    rank: user.rank,
    username: user.username
  };
}

export const getUserByUsername = async (username) => {
  if (!username) throw 'You must provide a username to search for';
  if (typeof username !== 'string') throw 'Invalid username type';
  
  const userCollection = await users();
  const user = await userCollection.findOne({ username: username });
  
  if (!user) {
    throw 'No user found with that username';
  }
  
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
    bio: user.bio,
    profileCustomization: user.profileCustomization,
    pickHistory: user.pickHistory,
    friends: user.friends,
    creditBalance: user.creditBalance,
    mmr: user.mmr,
    rank: user.rank
  };
}

 // function that takes in a game with a result updated (called in sportsData.js function updateMatches()) and 
 // scans for any picks on that game: if none, do nothing (maybe delete the game? a past game has no purpose in the db if nobody ever picked it)
 // if totalPicks > 0, scan each user's pickHistory for a pick on that game. 
 //     if they picked the winning team, update their balance with credits, add mmr to total and rank adjustment if necessary
 //     if they picked the losing team, subtract the mmr from their total and rank ajustmnet if necessary 
 //             ** rank adjustment should take place in a function where mmr is updated **
 //     update pick in pickHistory with W/L in the result
export const updatePicksOnGame = async (game) => {
  if (!game) throw new Error("Unexpected error: updatePicksOnGame did not receive a valid game input.");
  const totalPicks = game.totalPicks;
  let updatedPicksArr = [];
  if (totalPicks > 0) {
    const winningTeam = game.result;
    const gameTime = game.startTimeEST;
    const gameDate = game.startDateEST;
    if (!winningTeam || winningTeam === "TBA") throw new Error("Unexpected error: could not get result of given game in updatePicksOnGame.");
    let awayWinner = false;
    let homeWinner = false;
    const awayTeam = game.awayTeam;
    const homeTeam = game.homeTeam;
    if (winningTeam === awayTeam) awayWinner = true;
    if (winningTeam === homeTeam) homeWinner = true;
    const totalAwayPicks = game.totalAwayPicks;
    const totalHomePicks = game.totalHomePicks;
    let awayPicksCounted = 0;
    let homePicksCounted = 0;
    if (!awayWinner && !homeWinner) throw new Error("Unexpected error: could not retrieve awayTeam and homeTeam of game in updatePicksOnGame.");
    const userCollection = await users();
    const userArray = await userCollection.find().toArray();
    userArray.forEach(user => {
      let userPickHistory = user.pickHistory;
      if (userPickHistory.length > 0) {
        let i = 0;
        userPickHistory.forEach(userPick => {
          let result;
          let [pickDate, pickLeague, pickTeam, pickResult, pickOdds, pickWager, pickPayout, pickMMR] = userPick.pick.split(',');
          // ”MM/DD/YYYY,LEAGUE,TEAM,W/L/TBA,ODDS,WAGER,PAYOUT,MMR"

          if (pickDate === gameDate && userPick.pick.includes(pickLeague.toLowerCase()) && pickResult === "TBA") {
            if (userPick.pick.includes(winningTeam)) result = 'W'; else result = 'L';
            if (pickTeam === awayTeam) awayPicksCounted = awayPicksCounted + 1;
            if (pickTeam === homeTeam) homePicksCounted = homePicksCounted + 1;
            const newPick = `${pickDate},${pickLeague},${pickTeam},${result},${pickOdds},${pickWager},${pickPayout},${pickMMR}`; // adds in new result. possibly could make into a more readable format for user?
            let newUserPickHistory = userPickHistory;
            newUserPickHistory[i] = {pick: newPick};
            pickMMR = calculatePickMMR(newPick); // todo: implement calculatePickMMR function that takes in a pick and returns the mmr gain/loss depending on the pick information such as odds, wager amount, etc
            if (pickMMR === "MMR") pickMMR = 0; // this line can be removed once MMR is implemented, as the pick.mmr value is "MMR" as a placeholder, and it might throw errors updating the mmr in testing while this is still not implemented
            if (result === 'L') pickPayout = 0;
            const updatePickInfo = userCollection.updateOne(
              { _id: user._id },
              {
                $set: { 
                  creditBalance: user.creditBalance + pickPayout,
                  pickHistory: newUserPickHistory,
                  mmr: user.mmr + pickMMR
          // todo: the amount of MMR awarded per win should already be calculated when pick is submitted and in pickMMR. need to make function for calculating mmr --> calculatePickMMR() in line 201
          // maybe we can get rid of storing mmr for each pick since win/loss amounts are not always of the same magnitude. function calls and calculates mmr gain/loss based on pick info and is updated
          // furthermore, in this function, rank adjusting logic for the user should be implemented
                }
              }
            );
            if (!updatePickInfo) throw new Error("Could not update user for the new result of a match picked.");
            updatedPicksArr.push({user: user.username, pick: newPick});
          }
          i = i+1;
        });
      }
    });
    if (awayPicksCounted + homePicksCounted !== game.totalPicks || awayPicksCounted !== totalAwayPicks || homePicksCounted !== totalHomePicks) throw new Error("Error: did not find/update all picks on given game in updatePicksOnGame.");
  }
  return updatedPicksArr;
}

export const saveProfileEditorState = async (username, editorState) => {
  if (!username || !editorState) {
    throw 'Username and editor state must be provided';
  }
  
  const userCollection = await users();
  const updateInfo = await userCollection.updateOne(
    { username: username },
    { $set: { profileCustomization: editorState } }
  );
  
  if (!updateInfo.acknowledged) {
    throw 'Could not update profile customization';
  }
  
  return { success: true };
};

export const getProfileEditorState = async (username) => {
  if (!username) {
    throw 'Username must be provided';
  }
  
  const userCollection = await users();
  const user = await userCollection.findOne({ username: username });
  
  if (!user) {
    throw 'No user found with that username';
  }
  
  return user.profileCustomization || {};
};