// router/views/matchups.js
import {Router} from 'express';
const router = Router();
import validation from '../../utils/routeValidation.js';
import {getInSeasonSports, postOddsBySport, getMatchByID} from '../../data/sportsData.js'; //changed gamesData
import { ObjectId } from 'mongodb';
import { users } from '../../config/mongoCollections.js';
import { getUserById } from '../../data/users.js'; 
import { games } from '../../config/mongoCollections.js';
import { comment } from 'postcss';
import {Filter} from 'bad-words';


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
      const gameLogLeague = await postOddsBySport(req.params.league); // should pull games from DB if possible
      const leagueStr = leaguePath.substring(leaguePath.length - 3).toUpperCase().trim(); // "basketball_nba" --> "NBA", etc.
      
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
       
        const credBal = userFound.creditBalance;
        if (!credBal) throw new Error("Could not retreive creditBalance from user.");
        const leaguePath = req.params.league;
        const leagueStr = leaguePath.substring(leaguePath.length - 3).toUpperCase().trim(); // "basketball_nba" --> "NBA", etc.
        
        let awayOddsStr, homeOddsStr;
        if (!((match.awayOdds.toString()).includes('-'))) awayOddsStr = '+'.concat(match.awayOdds); else awayOddsStr = match.awayOdds;
        if (!((match.homeOdds.toString()).includes('-'))) homeOddsStr = '+'.concat(match.homeOdds); else homeOddsStr = match.homeOdds;
        let homePickPercentage = ((match.totalHomePicks / match.totalPicks).toFixed(2))*100;
        let awayPickPercentage = ((match.totalAwayPicks / match.totalPicks).toFixed(2))*100;
        // todo: since we can't get total credits wagered from games db, unless we go through each users' pickHistory for games with same UID,
        // we can't determine total percentage of credits wagered on each team and the percentages. I think it could be good to have that stat
        // because you can put in a ton of 1-credit picks to skew the community pick %, it should also be based on credit% on each team 
        return res.render('singleMatch', {leaguePath, leagueStr, match, ...match, homePickPercentage, awayPickPercentage, homeOddsStr, awayOddsStr, ...user, creditBalance: credBal}); // Renders singleMatch.handlebars with match to reference attributes of match on page
      } catch (e) {
        console.log(`Error in GET /mathcups/:league/:gameUID route: ${e}`);
        return res.status(404).render('leagueMatchups', {leaguePath: req.params.league, error: e}); // Renders back to matchups of league since they only click link for specific matchup through that page
      }
  })
  
router.route('/matchups/:league/:gameUID/submitPick').post(async (req, res) => {
    try {
      const teamPick = req.body.selectTeamPick;
      const [teamName, oddsStr, gameUID] = teamPick.split(',');
      const creditAmount = Number(req.body.creditsInput);
      let league = (req.params.league);
      if (!teamPick || !creditAmount) throw new Error('Unexpected error: missing teamPick and/or creditAmount.')
      const wager = parseInt(creditAmount);
      let odds = oddsStr;
      if (!teamName || !oddsStr || !gameUID) throw new Error("Unknown error: missing fields in teamPick.value");
      if (typeof teamName !== 'string') throw new Error("Expected teamName of type string");
      if (typeof oddsStr !== 'string') throw new Error("Expected oddsStr of type string");
      if (typeof gameUID !== 'string') throw new Error("Expected gameUID of type string");
      let profit;
      if (odds.includes('-')) {
        let favOddsNum = Number(odds.trim().split('-').join(''));
        profit = Number(creditAmount) / (favOddsNum/100);
      } else {
        let dogOddsNum = Number(odds);
        profit = Number(creditAmount) * (dogOddsNum/100);
        odds = '+'.concat(oddsStr);
      } 
      const potentialPayout = Number(creditAmount) + Math.round(profit);
      let mmr = "MMR"; //todo: implement mmr gain/loss algorithm
      if (!teamName || isNaN(odds)) throw new Error('Unexpected error: invalid team pick selection and/or odds');
      if (isNaN(wager) || wager <= 0) throw new Error('Unexpected error: invalid wager amount.')
      const userId = new ObjectId(req.session.user.userId);
      if (!userId) throw new Error("Unknown error: UserID not found from req.session.user");
      const userCollection = await users();
      const user = await userCollection.findOne({ _id: userId });
      if (!user) throw new Error("Unknown error: User not found from db");
      if (user.creditBalance < wager) throw new Error('Wager creditAmount cannot exceed your credit balance.');
      const newBalance = user.creditBalance - wager;
      let updateInfo;
      const gameCollection = await games();
      const gameOfPick = await gameCollection.findOne({uid: gameUID});
      const startDateEST = gameOfPick.startDateEST;
      if (!user) throw new Error(`User not found with id of ${userId}`)

      const userUpdateInfo = await userCollection.updateOne(
        { _id: userId },
        {
          $set: { creditBalance: newBalance },
          $push: {  
            pickHistory: {
              //todo: implement MMR gain/loss algorithm logic per pick
              //todo: update result in games, but, not needed here since picks should only be able to be placed pregame when result is TBA
              pick: `${startDateEST},${league},${teamName},TBA,${odds},${wager},${potentialPayout},${mmr}`
              // ”MM/DD/YYYY,LEAGUE,TEAM,W/L/TBA,ODDS,WAGER,PAYOUT,MMR" structure as taken from db proposal
              // separate into values with .split(',') if ever needed
            }
          }
        }
      );
      if (!userUpdateInfo) throw new Error(`Failed to update pick history of user ${req.session.user.username}.`);
      req.session.user.creditBalance = newBalance;
      const newTotalPicks = gameOfPick.totalPicks + 1;
      let newTotalTeamPicks;
      if (teamName === gameOfPick.awayTeam) {
        newTotalTeamPicks = gameOfPick.totalAwayPicks + 1;
        updateInfo = await gameCollection.updateOne(
          {uid: gameUID},
          {
            $set: {
              totalPicks: newTotalPicks,
              totalAwayPicks: newTotalTeamPicks
            }
          }
        );
      } else if (teamName === gameOfPick.homeTeam) {
        newTotalTeamPicks = gameOfPick.totalHomePicks + 1;
        updateInfo = await gameCollection.updateOne(
          {uid: gameUID},
          {
            $set: {
              totalPicks: newTotalPicks,
              totalHomePicks: newTotalTeamPicks
            }
          }
        );
      } else {
        throw new Error("Could not identify away/home team from submitted pick. Failed to update game in database.");
      }

      if (!updateInfo) throw new Error(`Failed to update pick info to game of uid ${uid}`);
      // const gameComments = gameOfPick.comments;

      // if (!gameComments) throw new Error("Unknown error: could not retrieve game comments");
      // if (gameComments.length > 0) {
      //   gameComments.forEach(gameComment => {
      //       // TODO: if making comments a mongo collection, then need to change gameComment.teamPicked = teamName to mongo updateOne() 
      //       // if (gameComment.author === user.username && (!gameComment.teamPicked)) gameComment.teamPicked = teamName;

      //       // OR: if making comments each a string like pickHistory, then the following: 
      //       // let [ id, author, comment, timeAuthoredEST, teamPicked ] = gameComment.split(',');
      //       // if (author === user.username && (!teamPicked)) teamPicked = teamName;
          
           
      //   });
      // }
      
      return res.redirect(`/matchups/${league}/${gameUID}`);

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
        gameUpdateInfo = await gameCollection.updateOne(
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
        gameUpdateInfo = await gameCollection.updateOne(
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
