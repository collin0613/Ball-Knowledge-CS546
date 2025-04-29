import { Router } from 'express';
const router = Router();

//render home page
router.route('/')
  .get(async (req, res) => {
    // If user is already logged in
    if (req.session.user) {
      return res.render('home', {
        loggedIn: true, 
        user: req.session.user,
      });
    }
    try {
      res.render('home', {
        loggedIn: false,
      });
    } catch (e) {
      res.status(500).render('error', { 
        error: 'An error occurred while loading the login page.' 
      });
    }
  });

  export default router;