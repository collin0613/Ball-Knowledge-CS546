import axios from 'axios';
import dotenv from 'dotenv';
import {games} from '../config/mongoCollections.js';
import {updatePicksOnGame} from './users.js';

dotenv.config(); //loading .env file into process.env


//using Odds API for team info/live odds, I only get 500 requests per month so try not to spam the requests
//-Tristan

const apiKey = process.env.ODDS_API_KEY;
const regions = 'us';
const markets = 'h2h';
const oddsFormat = 'american';
const dateFormat = 'iso';


//function that makes an API call to Odds API and gets a list of all in-season sports
export const getInSeasonSports = async () => {
  try{
    const response = await axios.get('https://api.the-odds-api.com/v4/sports', {
      params: {
        apiKey: apiKey,
      }  
    });
    return response.data;
  }catch (e){
    console.error('Error status:', e.response?.status);
    console.error("Error response: ", e.response?.data || e.message);
  }
  
};


//function that makes an API call to Odds API and gets a list of live & upcoming games for a chosen sport, along with odds for different
//bookmakers.
//This will deduct from the usage quota. 
//usage quota = [number of markets specified] x [number of regions specified]
//check https://the-odds-api.com/liveapi/guides/v4/#usage-quota-costs for more info
export const getOddsBySport = async (sportKey) => {

  try{
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
      params: {
        apiKey: apiKey,
        regions: regions,
        markets: markets,
        oddsFormat: oddsFormat,
        dateFormat: dateFormat,
      }
    });
    console.log('Remaining requests', response.headers['x-requests-remaining']);
    console.log('Used requests', response.headers['x-requests-used']);
    console.log('"Odds API data:', response.data);
    return response.data;
  }catch (e){
    console.error('Error status: ', e.response?.status);
    console.error('Error response: ', e.response?.data || e.message);
    throw e;
  }

};


//function that does exactly what getOddsBySport does but posts the data to the mongodb server
//i dont want to post every single request to the server because there is limited storage to the mongodb server (roughly 500mb)
//odds are pulled from FANDUEL only
//
export const postOddsBySport = async (sportKey) => {

  try{
    //exactly what getOddsBySport does
    const response = await getOddsBySport(sportKey);
    let insertGames = [];
    for(const game of response){
      //one by one insert each individual game fetched from the multiple given by the API call 
      
      //check if fanduel is supporting the specific game (most likely is)
      const fanduel = game.bookmakers.find(b => b.key === 'fanduel');
      if(!fanduel || !Array.isArray(fanduel.markets) || fanduel.markets.length === 0){
        console.warn(`Skipping game ${game.id}: No fanduel data.`);
        continue;
      }
      //more error checking for the market (not totally necessary but helped me fix a few bugs i was getting)
      const h2hMarket = fanduel.markets.find(m => m.key === 'h2h');
      if(!h2hMarket || !Array.isArray(h2hMarket.outcomes)){
        console.warn(`Skipping game ${game.id}: no H2H market or outcomes missing`);
        continue;
      }
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;
      const homeOdds = h2hMarket.outcomes.find(o => o.name === homeTeam)?.price;
      const awayOdds = h2hMarket.outcomes.find(o => o.name === awayTeam)?.price;
      //error checking if odds are provided (why wouldnt it be provided?)
      if(homeOdds === undefined || awayOdds === undefined){
        console.warn(`Skipping game ${game.id}: missing odds for home/away/both`);
        continue;
      }
      
      let [startDateStr, startTimeStr] = game.commence_time.split('T');
      startTimeStr = startTimeStr.substring(0, startTimeStr.length-1) // Removes the trailing 'Z' from time in the API's formatting
      let utcString = startDateStr.concat(" ", startTimeStr);
      const utcDate = new Date(utcString);
      const estInMS = utcDate.getTime() - (60*60*1000*4); // Time given is not UTC. It's four hours ahead of EST. Subtracting that here
      const estDate = new Date(estInMS); // Correct start time and date in EST as a Date(), rest is formatting for the string outputs 
      let month = (estDate.getMonth() + 1).toString();
      month = month.padStart(2, '0');
      let day = estDate.getDate().toString();
      day = day.padStart(2, '0');
      const year = estDate.getFullYear();
      let hour = estDate.getHours();
      const minutes = estDate.getMinutes().toString().padStart(2, '0');
      let ampm;
      if (hour >= 12) { ampm='PM'; } else { ampm='AM'; }
      hour = hour % 12;
      if (hour === 0) hour=12;
      hour = `${hour}`.padStart(2, '0');
      const startDateStrEST = `${month}/${day}/${year}`;
      const startTimeStrEST = `${hour}:${minutes} ${ampm} EST`;

      //defining the fields for our Games collection
      const singleGame = {
        uid: game.id,
        league: game.sport_title,
        startDateEST: startDateStrEST, // Format: "MM/DD/YYYY"
        startTimeEST: startTimeStrEST, // Format: "HH:MM AM/PM EST"
        awayTeam: awayTeam,
        homeTeam: homeTeam,
        awayOdds: awayOdds,
        homeOdds: homeOdds, 
        comments: [],
        totalPicks: 0,
        totalHomePicks: 0,
        totalAwayPicks: 0
      };
      insertGames.push(singleGame);
    }
    const gameCollection = await games();
    for(const game of insertGames){
      //inserting each game into the Games collection one by one
      const tryInsert = await gameCollection.findOne(
        {uid: game.uid}
      );
      if(!tryInsert){
        const insertInfo = await gameCollection.insertOne(game);
        if(!insertInfo.acknowledged || !insertInfo.insertedId) throw new Error(`Could not add game: ${game}`);
      }else{
        if (tryInsert.awayOdds !== game.awayOdds || tryInsert.homeOdds !== game.homeOdds) { // if odds received from API have changed since the game was initially inserted to the DB, then update the game in DB with new odds          const oddsUpdatedInfo = await userCollection.updateOne(
          const updatedOddsInfo = await gameCollection.updateOne(
            {uid: game.uid},
            {
              $set: {
                awayOdds: game.awayOdds,
                homeOdds: game.homeOdds
              }
            }
          );
          if (!updatedOddsInfo) throw new Error(`Failed to update game uid ${game.uid} with new odds.`);
        } else {
          continue;
        }
      }
    }
    return insertGames;

  }catch(e){
    console.error('Error status: ', e.response?.status);
    console.error('Error response: ', e.response?.data || e.message);
  }
};

export const geDBMatchesBySport = async (sportKey) => {
  // TODO - implemnent getting matches through the DB (so we are not using API calls unnecessarily)
  // should use when rendering leagueMatches, after we have called psotOddsBySport perhaps earlier in the session or day
  try {
    sportKey = validation.checkLeague(sportKey);
  } catch(e) {
    throw e;
  }
  try {
    const gameCollection = await games();
    if (!gameCollection) throw new Error("Could not fetch games from database.");
    let futureLeagueGames;
    const leagueStr = sportKey.substring(sportKey.length - 3).toUpperCase(); // 'icehockey_nhl' --> 'NHL', etc.
    for (const game of gameCollection) {
      if (game.league === leagueStr) {
        // TODO: confirm game.startTimeEST is in future of current Date() and time before pushing to futureLeagueGames
        let [gameDate, gameTimeEST] = game.startTimeEST.split('T');
        futureLeagueGames.push(game);
      }
    }
    return futureLeagueGames;
  } catch (e) {
    console.error('Error status: ', e.response?.status);
    return [];
  }
};


// Given a uid, finds and returns game info from a specific match in the games database
export const getMatchByID = async (id) => {
  try {
    if (!id) throw new Error('No uid input submitted for getMatchByID()');
    if (typeof id !== 'string') throw new Error('UID given was not of type string');
    id = id.trim();
    if (id.length === 0) throw new Error('uid inputted cannot be empty.');
    const gameCollection = await games();
    const foundMatch = await gameCollection.findOne({uid: id});
    if (!foundMatch) throw new Error(`No game found with UID ${id}.`);


    return foundMatch;
  } catch (e) {
    console.error('Error status: ', e.response?.status);
    console.error('Error response: ', e.response?.data || e.message);
    throw e;
  }
};


//function to convert date time from UTC to MM/DD/YYYY format
function getDate(changeDate){
  let [startDateStr, startTimeStr] = changeDate.split('T');
  startTimeStr = startTimeStr.substring(0, startTimeStr.length-1) // Removes the trailing 'Z' from time in the API's formatting
  let utcString = startDateStr.concat(" ", startTimeStr);
  const utcDate = new Date(utcString);
  const estInMS = utcDate.getTime() - (60*60*1000*4); // Time given is not UTC. It's four hours ahead of EST. Subtracting that here
  const estDate = new Date(estInMS); // Correct start time and date in EST as a Date(), rest is formatting for the string outputs 
  let month = (estDate.getMonth() + 1).toString();
  month = month.padStart(2, '0');
  let day = estDate.getDate().toString();
  day = day.padStart(2, '0');
  const year = estDate.getFullYear();
  let hour = estDate.getHours();
  const minutes = estDate.getMinutes().toString().padStart(2, '0');
  let ampm;
  if (hour >= 12) { ampm='PM'; } else { ampm='AM'; }
  hour = hour % 12;
  if (hour === 0) hour=12;
  hour = `${hour}`.padStart(2, '0');
  const startDateStrEST = `${month}/${day}/${year}`;
  const startTimeStrEST = `${hour}:${minutes} ${ampm} EST`;
  return [startDateStrEST, startTimeStrEST];

    
}

//helper function for getMatchResults
//returns an object {winner: ..., loser: ..., date: ...}, single outcome of match
//if match has not been played yet, specified by corresponding field in API dump, then return NULL
function getWinner(game, league){
  //all API dumps from corresponding leagues using their own API's return objects with varying keys, have to parse through separately for each
  //
  if(league === "mlb"){
    if(game.status.abstractGameState !== "Final") return null;
    const home = game.teams.home;
    const away = game.teams.away;
    let homeName = home.team.name;
    let awayName = away.team.name;
    if(homeName === "Athletics"){
      homeName = "Oakland Athletics";
    }else if(awayName === "Athletics"){
      awayName = "Oakland Athletics";
    }
    if(home.score > away.score){
      return {winner: homeName, loser: awayName, date: getDate(game.gameDate)};
    }else if(away.score > home.score){
      return {winner: awayName, loser: homeName, date: getDate(game.gameDate)};
    }else{
      return {result: "TIE", teams: [homeName, awayName], date: getDate(game.gameDate)};
    }
  }

  if(league === "nba"){
    if(game.status !== "Final") return null;
    const home = game.home_team;
    const away = game.visitor_team;
    const homeName = home.full_name;
    const awayName = away.full_name;

    if(game.home_team_score > game.visitor_team_score){
      return {winner: homeName, loser: awayName, date: getDate(game.datetime)};
    }else if(game.visitor_team_score > game.home_team_score){
      return {winner: awayName, loser: homeName, date: getDate(game.datetime)};
    }else{
      return {result: "TIE", teams: [homeName, awayName], date: getDate(game.datetime)};
    }
  }

  if(league === "nhl"){
    if(game.gameState !== "OFF") return null;
    const home = game.homeTeam;
    const away = game.awayTeam;
    const homeName = `${home.placeName?.default} ${home.commonName?.default}`;
    const awayName = `${away.placeName?.default} ${away.commonName?.default}`;

    if(home.score > away.score){
      return {winner: homeName, loser: awayName, date: getDate(game.startTimeUTC)};
    }else if(away.score > home.score){
      return {winner: awayName, loser: homeName, date: getDate(game.startTimeUTC)};
    }else{
      return {result: "TIE", teams: [homeName, awayName], date: getDate(game.startTimeUTC)};
    }
  }
 }


//function that takes in the matchResults produced in getMatchResults
//1. lookup each match in matchResults against DB
//2. insert new field 'result': the winning team
// TODO: add logic for cashouts/mmr system
export const updateMatches = async (resultsArray) => {
  let updatedCount = 0;
  const gameCollection = await games();


  for(const game of resultsArray){
    const gameDate = game.date[0];
    const gameTime = game.date[1];

    //convert to minutes
    const [matchHour, matchMinute, matchPeriod] = gameTime.split(/[: ]/);
    let matchMinutes = parseInt(matchHour) % 12;
    if(matchPeriod === 'PM') matchMinutes += 12;
    matchMinutes = matchMinutes * 60 + parseInt(matchMinute);
    
    //search for potential matches
    const potentialMatches = await gameCollection.find({
      startDateEST: gameDate,
      $or: [
        {homeTeam: game.winner, awayTeam: game.loser},
        {homeTeam: game.loser, awayTeam: game.winner}
      ]
    }).toArray();

    let matched = false;
    for(const record of potentialMatches){
      const [recHour, recMinute, recPeriod] = record.startTimeEST.split(/[: ]/);
      let recMinutes = parseInt(recHour) % 12;
      if (recPeriod === 'PM') recMinutes += 12;
      recMinutes = recMinutes * 60 + parseInt(recMinute);

      if(Math.abs(recMinutes - matchMinutes) <= 15) {
        await gameCollection.updateOne(
          {_id: record._id},
          {$set: {result: game.winner}}
        );
        updatedCount++;
        matched = true;
        const newGame = await gameCollection.findOne({_id: record._id});
        await updatePicksOnGame(newGame);// calls function that updates picks on this one game now that a result has been added
        break;
      }
    }
    if(!matched){
      console.warn("Skipping unmatched game: ", game);
    }
  }
  console.log(`Matches updated: ${updatedCount}`);
}

//function to return match results for NBA, NHL, MLB
//returns an object: {{winner: , loser: }, ...}
//if any fetch fails, return empty array []
//reminder: NHL api will give FUTURE games, whereas MLB and NBA api will only provide games of the given date 
//reminder: currently passing YESTERDAY's date to every API call
export const getMatchResults = async (league) => {
  let url;
  //creating the date string for YESTERDAY since the NHL API shows all upcoming games given a date. So calling https://api-web.nhle.com/v1/schedule/2025-05-11 will give you all games on 2025-05-11 and on, all of which have NOT ended yet. 
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); // todo: change back to 1!
  const formatted = yesterday.toISOString().split('T')[0];
  //determine which API to call given the league. some are public and dont require a key (NHL), while some do (NBA)
  switch (league.toLowerCase()) {
    case 'mlb':
      url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${formatted}`;
      break;
    case 'nba':
      break;
    case 'nhl':
      url = `https://api-web.nhle.com/v1/schedule/${formatted}`;
      break;
    default:
      throw new Error("Invalid league. Use 'nba', 'mlb', or 'nhl'.");
  }

  try{
    if (league === 'nba'){
      //API call for NBA league
      const response = await fetch(`https://api.balldontlie.io/v1/games?start_date=${formatted}&end_date=${formatted}`, {
        headers: {
          'Authorization': process.env.BALL_DONT_LIE_KEY
        }
      });
      const data = await response.json();
      let matchResults = [];
      //iterating through each game to compute winner and date of match
      for(const game of data.data){
        const singleResult = getWinner(game, league);
        if(singleResult) matchResults.push(singleResult);
      }
      const updateGames = await updateMatches(matchResults);
      return data;
    }
    if (league === 'mlb'){
      //API call for MLB league
      const res = await fetch(url);
      const data = await res.json();
      let matchResults = [];
      //dates is an array inside data, and games is a nested array inside dates
      data.dates?.[0]?.games.forEach(game => {
        const singleResult = getWinner(game, league);
        if(singleResult) matchResults.push(singleResult);
      });
      const updateGames = await updateMatches(matchResults);
      return data;
    }
    if (league === 'nhl'){
      //fetching API call for NHL and returning dump
      const res = await fetch(url);
      const data = await res.json();
      //building the array of results
      let matchResults = [];
      //parsing through the data object to find the games specified by the search date (since this API shows future games as well)
      const targetDay = data.gameWeek.find(day => day.date === formatted);
      if(!targetDay || !targetDay.games){
        return [];
      }
      targetDay.games.forEach(game => {
        //determine the result for each game
        const singleResult = getWinner(game, league);
        if (singleResult) matchResults.push(singleResult);
      });
      const updateGames = await updateMatches(matchResults);
      return data;
    }
  }catch (e){
    console.error(`Error fetching ${league} data:`, e);
    return [];
  }

};
