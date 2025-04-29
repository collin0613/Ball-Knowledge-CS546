import { Router } from 'express';
const router = Router();
import { createUser } from '../../data/users.js'; 

//render login page
router.route('/login').get(async (req, res) => {
  try {
    res.render('login');
  } catch (e) {
    res.status(500).render('error', { 
      error: 'An error occurred while loading the login page.' 
    });
  }
});

//render signup page, handle signup form submission
router.route('/signup')
  .get(async (req, res) => {
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
      
      // Check if passwords match
      if (userData.password !== userData.confirmPassword) {
        throw 'Passwords do not match';
      }
      
      // Call the createUser function from the data layer
      const newUser = await createUser(
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.username,
        userData.password,
        userData.bio

      );
      
      // Redirect to login page after successful signup
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

export default router;

