import {Router} from 'express';
const router = Router();
import validation from '../../utils/routeValidation.js';
import {getInSeasonSports, getOddsBySport, postOddsBySport, getMatchResults} from '../../data/sportsData.js'; //changed gamesData

// is this needed?

//routing for getInSeasonSports (what can be pulled from API)

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
  .route('/results/:id')
  .get(async (req, res) => {
    try{
      const league = req.params.id;
      console.log(`league : ${league}`);
      const gameResult = await getMatchResults(league);
      return res.json(gameResult);
    }catch(e){
      return res.status(500).send(e);
    }
  });

//routing for getOddsBySport (pulling specific league from API)


router
  .route('/:id')  // Get a specific sports game log, ex : nhl, nba, mlb
  .get(async (req, res) => {
    try {
      req.params.id = validation.checkLeague(req.params.id);
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const gameLogLeague = await postOddsBySport(req.params.id);
      return res.json(gameLogLeague);
    } catch (e) {
      return res.status(404).json(e);
    }
  });

export default router;


