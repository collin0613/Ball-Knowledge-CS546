import { Router } from 'express';
const router = Router();
import { createUser, getUserById, getUserByUsername } from '../../data/users.js'; 
import bcrypt from 'bcrypt';
import {users} from '../../config/mongoCollections.js';

//render login page
router.route('/login')
  .get(async (req, res) => {
    // If user is already logged in, redirect to home page
    if (req.session.user) {
      return res.redirect('/');
    }
    try {
      res.render('login');
    } catch (e) {
      res.status(500).render('error', { 
        error: 'An error occurred while loading the login page.' 
      });
    }
  })
  .post(async (req, res) => {
    const { username, password } = req.body;
    
    // Input validation
    try {
      if (!username || !password) {
        throw 'You must provide both username and password';
      }
      
      if (typeof username !== 'string' || typeof password !== 'string') {
        throw 'Username and password must be strings';
      }
      
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      if (trimmedUsername.length < 3) {
        throw 'Username must be at least 3 characters';
      }
      
      if (trimmedPassword.length < 6) {
        throw 'Password must be at least 6 characters';
      }
      
      // find user in database
      const userCollection = await users();
      const user = await userCollection.findOne({ username: trimmedUsername });
      
      if (!user) {
        throw 'No account found with that username';
      }
      
      // Compare passwords
      const match = await bcrypt.compare(trimmedPassword, user.hashedPassword);
      
      if (!match) {
        throw 'Password is invalid';
      }
      
      // user authenticated successfully so we create session
      req.session.user = {
        userId: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        rank: user.rank,
        mmr: user.mmr,
        creditBalance: user.creditBalance,
        friends: user.friends
      };
      
      return res.redirect('/');
      
    } catch (e) {
      return res.status(400).render('login', {
        error: e,
        username: username
      });
    }
  });

//logout route
router.route('/logout').get(async (req, res) => {
  // destroy the session
  req.session.destroy();
  
  // tender the logout confirmation page
  return res.render('logout');
});




//render signup page, handle signup form submission
router.route('/signup')
  .get(async (req, res) => {
    // if user is already logged in, redirect to home page
    if (req.session.user) {
      return res.redirect('/');
    }
    try {
      res.render('signup');
    } catch (e) {
      res.status(500).render('error', { 
        error: 'An error occurred while loading the signup page.'
      });
    }
  })
  .post(async (req, res) => {
    const userData = req.body;
    try {
      if (!userData.firstName || !userData.lastName || !userData.email || 
          !userData.username || !userData.password || !userData.confirmPassword) {
        throw 'All required fields must be provided';
      }
      
      // check if passwords match
      if (userData.password !== userData.confirmPassword) {
        throw 'Passwords do not match';
      }
      //check if username and email already exist in userrs collection
      const userCollection = await users();
      const existingUser = await userCollection.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw 'Username already exists';
        }
        if (existingUser.email === userData.email) {
          throw 'Email already in use';
        }
      }
      
      // call the createUser function from the data layer
      const newUser = await createUser(
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.username,
        userData.password,
        userData.bio
      );
      
      // redirect to login page after successful signup
      res.redirect('/account/login');
      
    } catch (e) {
      res.status(400).render('signup', {
        error: e,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
      });
    }
  });

// profile routes
router.route('/profile')
  .get(async (req, res) => {
    // check if user is logged in
    if (!req.session.user) {
      return res.redirect('/account/login');
    }
    
    try {
      // get the user data from the database
      const user = await getUserByUsername(req.session.user.username);
      console.log('User data:', user);
      return res.render('profile', {
        title: 'Your Profile',
        user: user
      });
    } catch (e) {
      return res.status(500).render('error', {
        error: 'An error occurred while loading your profile.'
      });
    }
  });

router.route('/findUsers')
  .get(async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/account/login');
    }
    res.render('findUsers', { usersFound: null });
  })
  .post(async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/account/login');
    }

    let searchTerm = req.body.usernameInput?.trim();
    const currentUsername = req.session.user.username;
    let usersFound = [];

    if (!searchTerm) {
      return res.status(400).render('findUsers', {
        error: 'Search term input cannot be empty',
        usersFound: []
      });
    }

    try {
      const userCollection = await users();
      const allUsers = await userCollection.find({ username: { $ne: currentUsername } }).toArray(); // all users except current user
      const searchTermLower = searchTerm.toLowerCase();
      usersFound = allUsers.filter(u =>
        u.username.includes(searchTermLower) // username INCLUDES searched term. findUsers for "jo" would return links to usernames "johnny", "jordan", "banjo", etc.
      );
      return res.render('findUsers', { usersFound });
    } catch (e) {
      return res.status(500).render('error', { error: e });
    }
  });

router.post('/addFriend', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/account/login');
  }
  const currentUsername = req.session.user.username;
  const friendUsername = req.body.friendUsername?.trim();
  if (!friendUsername || currentUsername === friendUsername) return res.render('findUsers', { usersFound: [], friendError: 'Invalid friend request.'});
  
  try {
    const userCollection = await users();
    const currentUser = await userCollection.findOne({username: currentUsername});
    let currentFriendRequests = currentUser.friendRequests;
    if (!currentFriendRequests) return res.render('findUsers', { usersFound: [], friendError: "Could not receive current user's friend requests."});
    let userFriendInfo;
    let otherFriendInfo;
    if (currentFriendRequests.length !== 0) {
      currentFriendRequests.forEach(async requestUsername => {
        // Case 1: current user sent a friend request to a user who has already sent them a friend request --> add each user to the other's friends list
        if (requestUsername === friendUsername) { 
          userFriendInfo = await userCollection.updateOne(
            { username: currentUsername },
            { 
              $push: { friends: friendUsername }, // add friend to friends of current user
              $pull: { friendRequests: friendUsername} // remove pending friend request from friend
             }
          );
          otherFriendInfo = await userCollection.updateOne(
            { username: friendUsername },
            { 
              $push: { friends: currentUsername }, // add current user to friends of friend
              $pull: { friendRequests: currentUsername} // remove pending friend request from user
             }
          );
          if (!userFriendInfo || !otherFriendInfo) return res.render('findUsers', { usersFound: [], friendError: `Could not successfully add user "${friendUsername}" as a friend.`});
          
          return res.render('findUsers', {
            usersFound: [],
            friendSuccess: `You successfully added "${friendUsername}" as a friend!` // return for friend added
          });
        }
      });
    }
    // Case 2: current user is sending a friend request to a user who has not sent them a friend request --> add current user to friend's friendRequests list
    if (!userFriendInfo && !otherFriendInfo) {
      const friendUser = await userCollection.findOne({ username: friendUsername });
      // confirm that the users are not already friends
      let friendFriendsList = friendUser.friends;
      let userFriendsList = currentUser.friends;
      let alreadyFriends = false;
      if (!friendFriendsList) return res.render('findUsers', { usersFound: [], friendError: `Could not receive friends of user "${friendUsername}".`});
      friendFriendsList.forEach(friend => {
        if (friend === currentUsername) alreadyFriends = true; // check both users' friends lists to confirm not already friends
      });
      userFriendsList.forEach(friend => {
        if (friend === friendUsername) alreadyFriends = true; // check both users' friends lists to confirm not already friends
      });
      if (alreadyFriends) return res.render('findUsers', { usersFound: [], friendError: `You are already friends with "${friendUsername}"!`});
      
      // confirm that the current user does not already have a pending friend request to the friend user
      let friendUserRequests = friendUser.friendRequests;
      if (!friendUserRequests) return res.render('findUsers', { usersFound: [], friendError: `Could not receive friendRequests attribute for user "${friendUsername}".`});
      let sentReqToFriend = false;
      friendUserRequests.forEach(friendReqUsername => {
        if (friendReqUsername === currentUsername) sentReqToFriend = true;
      });
      if (sentReqToFriend) return res.render('findUsers', { usersFound: [], friendError: `You already have a pending friend request sent to "${friendUsername}".`});

      // add currentUser username to friend requests of other user
      const requestAdded = await userCollection.updateOne(
        { username: friendUsername },
        { $push: { friendRequests: currentUsername } }
      );
      if (!requestAdded) return res.render('findUsers', { usersFound: [], friendError: `Could not successfully send a friend request to user "${friendUsername}".`});
      let successMsg = `You successfully sent a friend request to "${friendUsername}".`;
      return res.render('findUsers', {
        usersFound: [],
        friendSuccess: successMsg
      });
    }

  } catch (e) {
    return res.render('findUsers', {
      usersFound: [],
      friendError: 'Something went wrong. Please try again.'
    });
    
  }
});


  router.route('/profile/:username')
  .get(async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/account/login');
    }
    const username = req.params.username;
    try {
      const user = await getUserByUsername(username);
      
      return res.render('profileID', {
        title: `${username}'s Profile`,
        user: user,
      });
    } catch (e) {
      return res.status(404).render('error', {
        error: 'User not found'
      });
    }
  });

export default router;

