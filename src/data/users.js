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
    profileCustomization: [],
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