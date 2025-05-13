import { Router } from 'express';
const router = Router();
import { getMatchResults } from '../../data/sportsData.js';

//render home page
router.route('/')
  .get(async (req, res) => {
    // If user is already logged in
    if (req.session.user) {
      let mlbUpdatedMatches = await getMatchResults('mlb');
      let nbaUpdatedMatches = await getMatchResults('nba');
      let nhlUpdatedMatches = await getMatchResults('nhl');
      return res.render('homepage', {
        loggedIn: true, 
        user: req.session.user,
      });
    }
    try {
      res.render('homepage', {
        loggedIn: false,
      });
    } catch (e) {
      res.status(500).render('error', { 
        error: 'An error occurred while loading the login page.' 
      });
    }
  });

  export default router;