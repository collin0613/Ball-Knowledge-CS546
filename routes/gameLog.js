import {Router} from 'express';
const router = Router();
import validation from './routeValidation.js';
import {getInSeasonSports, getOddsBySport} from '../data/sportsData.js'; //changed gamesData

router
  .route('/')
  .get(async (req, res) => {    // Get all sports game logs
    try {
      const inSeasonLog = await getInSeasonSports();
      return res.json(inSeasonLog);
    } catch (e) {
      return res.status(500).send(e);
    }
  });
router
  .route('/:id')  // Get a specific sports game log, ex : nhl, nba, mlb
  .get(async (req, res) => {
    try {
      req.params.id = validation.checkLeague(req.params.id);
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const gameLogLeague = await getOddsBySport(req.params.id);
      return res.json(gameLogLeague);
    } catch (e) {
      return res.status(404).json(e);
    }
  });


  export default router;
