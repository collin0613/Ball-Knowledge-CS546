import axios from 'axios';
import dotenv from 'dotenv';
import {games} from '../config/mongoCollections.js';
//using Odds API, I only get 500 requests per month so try not to spam the requests
//-Tristan

dotenv.config(); //loading .env file into process.env
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
    //not sure if this next line is needed?
    throw e;
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
        console.warn(`Skipping game ${game.id}: missing odds for home/way/both`);
        continue;
      }

      //defining the fields for our Games collection
      const singleGame = {
        uid: game.id,
        league: game.sport_title,
        startTimeEST: game.commence_time,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeOdds: homeOdds, 
        awayOdds: awayOdds,
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
      if(tryInsert){
        const insertInfo = await gameCollection.insertOne(game);
        if(!insertInfo.acknowledged || !insertInfo.insertedId) throw new Error(`Could not add game: ${game}`);
      }else{
        continue;
      }
    }
    return insertGames;
    

  }catch(e){
    console.error('Error status: ', e.response?.status);
    console.error('Error response: ', e.response?.data || e.message);
  }
};
