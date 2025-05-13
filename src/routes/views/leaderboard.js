import { Router } from 'express';
const router = Router();
import { getLeaderboard } from '../../data/leaderboard.js';

//render home page
router.route('/')
  .get(async (req, res) => {
    // If user is already logged in
    if (req.session.user) {
        try{
            const leaderboard = await getLeaderboard();
                return res.render('leaderboard', {
                    loggedIn: true,
                    user: req.session.user,
                    leaderboard: leaderboard,
            });
        }
        catch (e) {
            res.status(500).render('error', { 
              error: 'An error occurred while loading the login page.' 
            });
        }
    }

    try {
     //  user is not logged in
        const leaderboard = await getLeaderboard();
        res.render('leaderboard', {
            loggedIn: false,
            leaderboard: leaderboard
      });
    } 
    catch (e) {
      res.status(500).render('error', { 
        error: 'An error occurred while loading the login page.' 
      });
    }

  });
  export default router;
