import axios from 'axios';
import dotenv from 'dotenv';
//using Odds API, I only get 500 requests per month so try not to spam the requests
//-Tristan

dotenv.config(); //loading .env file into process.env
const apiKey = process.env.ODDS_API_KEY;
const sportKey = 'icehockey_nhl';
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
    console.error(e.response?.data);
    //not sure if this next line is needed?
    throw e;
  }
  
}

// axios.get('https://api.the-odds-api.com/v4/sports', {
//   params: {
//     apiKey
//   }
// })
// .then(response => {
//     console.log(response.data);
//   })
// .catch(error => {
//     console.log('Error status: ', error.response.status);
//     console.log(error.response.data);
//   });


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
    return response.data;
  }catch (e){
    console.error('Error status: ', e.response?.status);
    console.error(e.response?.data);
    throw e;
  }
  // const response = axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
  //   params: {
  //     apiKey: apiKey,
  //     regions: regions,
  //     markets: markets,
  //     oddsFormat: oddsFormat,
  //     dateFormat: dateFormat,
  //   }
  // })
  // .then(response => {
  //     //response.data.data contains a list of live and upcoming events and odds for different bookmakers.
  //     //events are ordered by start time (live events are first)
  //     console.log(JSON.stringify(response.data));
  //     //check usage
  //     console.log('Remaining requests', response.headers['x-requests-remaining']);
  //     console.log('Used requests', response.headers['x-requests-used']);
  //   })
  // .catch(error => {
  //     console.log('Error status: ', error.response.status);
  //     console.log(error.response.data);
  //   });
  //
  // return response;

}















//
// axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
//   params: {
//     apiKey,
//     regions,
//     markets,
//     oddsFormat,
//     dateFormat,
//   }
// })
// .then(response => {
//     //response.data.data contains a list of live and upcoming events and odds for different bookmakers.
//     //events are ordered by start time (live events are first)
//     console.log(JSON.stringify(response.data));
//     //check usage
//     console.log('Remaining requests', response.headers['x-requests-remaining']);
//     console.log('Used requests', response.headers['x-requests-used']);
//   })
// .catch(error => {
//     console.log('Error status: ', error.response.status);
//     console.log(error.response.data);
//   });




