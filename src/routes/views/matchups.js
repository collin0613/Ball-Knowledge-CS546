// router/views/matchups.js
import {Router} from 'express';
const router = Router();
import validation from '../../utils/routeValidation.js';
import {getInSeasonSports, getOddsBySport, postOddsBySport, getMatchByID} from '../../data/sportsData.js'; //changed gamesData
import { ObjectId } from 'mongodb';
import { users } from '../../config/mongoCollections.js';
import { getUserById } from '../../data/users.js'; 
import { comment } from 'postcss';
import {Filter} from 'bad-words';


//routing for getInSeasonSports (what can be pulled from API)

router
  .route('/matchups')
  .get(async (req, res) => {    // Get all sports game logs
    try {
      const inSeasonLog = await getInSeasonSports();
      if (!inSeasonLog) throw new Error("Could not retreive current in-season sports.");
      const user = req.session.user;
      if (!user) throw new Error('Unknown error: user not found.');
      return res.render('matchups', { inSeasonLog }); // do we have any reason to render passing {inSeasonLog, user}?
    } catch (e) {
      console.log(`Error: ${e}.`);
      return res.status(500).render('homepage', {error: e});
    }
  });


//routing for getOddsBySport (pulling specific league from API)

router
  .route('/matchups/:league')  // Get a specific sports game log, ex : nhl, nba, mlb
  .get(async (req, res) => {
    try {
      req.params.league = validation.checkLeague(req.params.league);
    } catch (e) {
      return res.status(400).render('matchups', {error: e});
    }
    try {
      const leaguePath = req.params.league;
      console.log(`leaguePath: ${leaguePath}`);
      const gameLogLeague = await postOddsBySport(req.params.league); // should pull games from DB if possible
      const leagueStr = leaguePath.substring(leaguePath.length - 3).toUpperCase().trim(); // "basketball_nba" --> "NBA", etc.
      console.log(`leagueStr: ${leagueStr}`);
      return res.render('leagueMatchups', {leagueStr, leaguePath, gameLogLeague});
    } catch (e) {
      return res.status(404).render('matchups', {error: e});
    }
  });


// Routing to display a unique game; user clicks a game link from displayed games in a league

// TODO: middleware prevents GET /matchups for non-authenticated users
router
  .route('/matchups/:league/:gameUID')
  .get(async (req, res) => {
    try {
        console.log("Entered GET /matchups/:league/:gameUID router.");
        req.params.league = validation.checkLeague(req.params.league);
      } catch (e) {
        return res.status(400).render('leagueMatchups', {leaguePath: req.params.league, error: e}); // Renders back to matchups of league since they only click link for specific matchup through that page
      }
      try {
        let uid = req.params.gameUID;
        if (typeof uid !== 'string') throw new Error('UID not of type string was received.');
        uid = uid.trim();
        if (uid.length === 0) throw new Error('UID is an empty string.');
        const match = await getMatchByID(uid);
        if (!match) throw new Error(`Unknown error: could not retrieve match with UID of ${uid}.`);
        
        let user = req.session.user;
        if (!user) throw new Error('Unknown error: user not found from req.session.user')
        
        let userId = user.userId;
        const userFound = await getUserById(userId);
        if (!userFound) throw new Error(`User not found with id of ${userId}`)
        const credBal = userFound.creditBalance;
        if (!credBal) throw new Error("Could not retreive creditBalance from user.");
        const leaguePath = req.params.league;
        const leagueStr = leaguePath.substring(leaguePath.length - 3).toUpperCase().trim(); // "basketball_nba" --> "NBA", etc.
        
        let awayOddsStr, homeOddsStr;
        if (!((match.awayOdds.toString()).includes('-'))) awayOddsStr = '+'.concat(match.awayOdds); else awayOddsStr = match.awayOdds;
        if (!((match.homeOdds.toString()).includes('-'))) homeOddsStr = '+'.concat(match.homeOdds); else homeOddsStr = match.homeOdds;
        
        return res.render('singleMatch', {leaguePath, leagueStr, match, ...match, homeOddsStr, awayOddsStr, ...user, creditBalance: credBal}); // Renders singleMatch.handlebars with match to reference attributes of match on page
      } catch (e) {
        console.log(`Error in GET /mathcups/:league/:gameUID route: ${e}`);
        return res.status(404).render('leagueMatchups', {leaguePath: req.params.league, error: e}); // Renders back to matchups of league since they only click link for specific matchup through that page
      }
  })
  
router.route('/matchups/:league/:gameUID/submitPick').post(async (req, res) => {
    try {
      const { teamPick, creditAmount } = req.body;
      if (!req.session.user || !req.session.user._id) throw new Error("Unknown error: User not found from req.session.user");
      let league = (req.params.league);
      if (!teamPick.value || !creditAmount.value) throw new Error('Unexpected error: missing teamPick and/or creditAmount.')
  
      const [teamName, oddsStr, gameUID] = teamPick.value.split(',');
      const wager = parseInt(creditAmount.value);
      let odds = oddsStr;
      if (!teamName || !oddsStr || !gameUID) throw new Error("Unknown error: missing fields in teamPick.value");
      if (typeof teamName !== 'string') throw new Error("Expected teamName of type string");
      if (typeof oddsStr !== 'string') throw new Error("Expected oddsStr of type string");
      if (typeof gameUID !== 'string') throw new Error("Expected gameUID of type string");
      let profit;
      if (odds.contains('-')) {
        let favOddsNum = Number(odds.trim().split('-').join(''));
        profit = Number(creditAmount) / (favOddsNum/100);
      } else {
        let dogOddsNum = Number(odds);
        profit = Number(creditAmount) * (dogOddsNum/100);
        odds = '+'.concat(oddsStr);
      } 
      const potentialPayout = Number(creditAmount) + profit;
      let mmr; //todo: implement mmr gain/loss algorithm
      if (!teamName || isNaN(odds)) throw new Error('Unexpected error: invalid team pick selection and/or odds');
      if (isNaN(wager) || wager <= 0) throw new Error('Unexpected error: invalid wager amount.')
      const userId = new ObjectId(req.session.user._id);
      const userCollection = await users();
      const user = await userCollection.findOne({ _id: userId });
      if (!user) throw new Error("Unknown error: User not found from req.session.user");
      if (user.creditBalance < wager) throw new Error('Wager creditAmount cannot exceed your credit balance.');
      const newBalance = user.creditBalance - wager;

      const userUpdateInfo = await userCollection.updateOne(
        { _id: userId },
        {
          $set: { creditBalance: newBalance },
          $push: {
            pickHistory: [{
              //todo: implement MMR gain/loss algorithm logic per pick
              pick: `${startDateEST},${league},${teamName},TBA,${odds},${wager},${potentialPayout},${mmr}`
              // ”MM/DD/YYYY,LEAGUE,TEAM,W/L/TBA,ODDS,WAGER,PAYOUT,MMR" structure as taken from db proposal
              // separate into values with .split(',') if ever needed
            }]
          }
        }
      );
      if (!userUpdateInfo) throw new Error(`Failed to update pick history of user ${req.session.user.username}.`);
      req.session.user.creditBalance = newBalance;
      
      let updateInfo;
      const gamesCollection = await games();
      if (teamPick.id === "optionAwayTeam") {
        updateInfo = await gamesCollection.updateOne(
          {uid: gameUID},
          {
            $update: {
              totalPicks: totalPicks + 1,
              totalAwayPicks: totalAwayPicks + 1
            }
          }
        );
      } else if (teamPick.id === "optionHomeTeam") {
        updateInfo = await gamesCollection.updateOne(
          {uid: gameUID},
          {
            $update: {
              totalPicks: totalPicks + 1,
              totalHomePicks: totalHomePicks + 1
            }
          }
        );
      } else {
        throw new Error("Could not identify away/home team in teamPick id.");
      }

      if (!updateInfo) throw new Error(`Failed to update pick info to game of uid ${uid}`);
      const gameFound = await gamesCollection.findOne({uid: gameUID});
      const gameComments = gameFound.comments;

      if (!gameComments) throw new Error("Unknown error: could not retrieve game comments");
      if (gameComments.length > 0) {
        gameComments.forEach(gameComment => {
          if (gameComment.author === user.username && (!gameComment.teamPicked)) gameComment.teamPicked = teamName;
            // if making comments a mongo collection, then need to 
            // change gameComment.teamPicked = teamName to mongo updateOne() and $set or $update process
        });
      }
      return res.render('singleMatch', {leaguePath, leagueStr, match, ...match, homeOddsStr, awayOddsStr, ...user, creditBalance: credBal});

    } catch (e) {
      return res.status(404).render('singleMatch', { error: e });
    }
  });

router.route('/matchups/:league/:gameUID/submitComment').post(async (req, res) => {
    try{
      // possibly might be commentMessage.value instead of just commentMessage;
      // or if commentMessage.id !== 'commentInput'/'postCommentForm' (if it's failing at all)?
      let commentMessage = req.body;
      if (!commentMessage) throw new Error("You must provide a valid comment message.");
      if (typeof commentMessage !== 'string') throw new Error('Unknown error: commentMessage is not of type string.');
      commentMessage = commentMessage.trim();
      if (commentMessage.length === 0) throw new Error("Comment message cannot be empty.");
      const profanityFilter = new Filter();
      if (profanityFilter.isProfane(commentMessage)) throw new Error("Profanity was detected in your comment.");
      const user = req.session.user;
      if (!user) throw new Error("User not found in the session.");
      const authorStr = user.username;
      if (!authorStr) throw new Error("Could not retrieve current user's username for comment.");
      if (typeof authorStr !== 'string') throw new Error('Unknown error: username is not of type string.');
      const gameCollection = await games();
      const gameFound = await gameCollection.findOne({uid: req.params.gameUID});
      const gameFoundUID = gameFound.uid;
      const userCollection = await users();
      const userFound = userCollection.findOne({_id: user._id});
      let teamNamePicked;
      if (!userFound) throw new Error(`Unknown error: could not find user in users database with id ${user._id}.`);
      const userPickHistory = userFound.pickHistory;
      if (!userPickHistory) throw new Error("Unknown error: could not retrieve user pickHistory.");
      if (pickHistory.length > 0) {
        userPickHistory.forEach(userPick => {
          const [_startDateEST, _league, _teamName, _result, _odds, _wager, _potentialPayout, _mmr ] = userPick.pick.split(',');
          if (_startDateEST === gameFound.startDateEST && (_teamName === gameFound.awayTeam || _teamName === gameFound.homeTeam) && gameFound.totalPicks > 0) {
            teamNamePicked = _teamName;
          }
        });
      }
      let gameUpdateInfo;
      // if comment.teamPicked exists, then we make their username color the same as the team, or put the team's logo, or some other indicator
      if (teamNamePicked.length > 0) {
        gameUpdateInfo = await gamesCollection.updateOne(
          {uid: gameFoundUID},
          {
            $push: {
            comments: [{
              author: authorStr,
              comment: commentMessage,
              timeAuthoredEST: (new Date()).toLocaleTimeString('en_us', {timeZone: 'America/New_York'}),
              teamPicked: teamNamePicked
            }]
          }
        });
      } else {
        gameUpdateInfo = await gamesCollection.updateOne(
          {uid: gameFoundUID},
          {
            $push: {
              comments: [{
                author: authorStr,
                comment: commentMessage,
                timeAuthoredEST: (new Date()).toLocaleTimeString('en_us', {timeZone: 'America/New_York'})
              }]
            }
          }
        );
      }
      if (!gameUpdateInfo) throw new Error(`Could not update game comments of game with UID ${rew.params.gameUID}.`);
      return res.render('singleMatch', {leaguePath, leagueStr, match, ...match, homeOddsStr, awayOddsStr, ...user, creditBalance: credBal});
  } catch (e) {
    return res.status(400).render('singleMatch', {error: e});
  }});

  // todo: function to update games in DB with win/loss result (from api call?) and administer payouts to winning picks
  // games in db don't have a "result"/"winner" attribute currently may need to implement that if we can reliably get the data of which teams won past games (live scores?)
  export default router;
