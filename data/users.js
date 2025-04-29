import { users } from '../config/mongoCollections.js';

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
  

  
  // for now, store the password directly
  const hashedPassword = password;
  
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
    creditBalance: 1000,
    mmr: 0,
    rank: 'Unranked'
  };
  
  // insert
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