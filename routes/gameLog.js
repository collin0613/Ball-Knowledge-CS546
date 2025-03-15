import {Router} from 'express';
const router = Router();
import validation from './routeValidation.js';
import gamesData from '../data/gameLog.js';

router
  .route('/')
  .get(async (req, res) => {    // Get all sports game logs
    try {
      const gameLog = await gamesData.getAllLeaguesGameLogs();
      return res.json(gameLog);
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
      const gameLogLeague = await gamesData.getGameLogByLeague(req.params.id);
      return res.json(gameLogLeague);
    } catch (e) {
      return res.status(404).json(e);
    }
  });


  export default router;