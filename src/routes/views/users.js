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
        lastName: user.lastName
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
        user: user,
      });
    } catch (e) {
      return res.status(500).render('error', {
        error: 'An error occurred while loading your profile.'
      });
    }
  });

export default router;

