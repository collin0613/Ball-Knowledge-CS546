import express from "express";
import axios from "axios";


async function getGameLogByLeague(league) {
    try {
        if (league === "NHL") {

            return await getTodaysNHLGameLog();
        } 
        else {
            throw `Error: ${league} is not a supported. Supported leagues include: 'NHL'.`;
        }
    } catch (error) {
        throw error;
    }
}



async function getTodaysNHLGameLog() {
  try {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await axios.get(`https://api-web.nhle.com/v1/schedule/${today}`);
      return data;
  } catch (error) {
       throw ("Error fetching NHL game log:", error);
  }
}


export default { getGameLogByLeague, getTodaysNHLGameLog };