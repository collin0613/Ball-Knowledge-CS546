import express from "express";
import axios from "axios";
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);


async function getGameLogByLeague(league) {
    try {
      if (league === "NHL" || league === "NBA" || league === "MLB") {

        const { stdout, stderr } = await execPromise(`python3 ./oddsScrape/scrape.py ${league}`);
        
        if (stderr && !stderr.includes('NotOpenSSLWarning')) {
          throw new Error(`Python script error: ${stderr}`);
        }
        
        const gameData = JSON.parse(stdout);
        
        return gameData;
      } else {
        throw `Error: ${league} is not currently supported. Supported leagues include: 'NHL', 'NBA', and 'MLB'`;
      }
    } catch (error) {
      throw (`Error fetching ${league} game log: ${error}`);
    }
  }

  async function getAllLeaguesGameLogs() {
    try {
        const nhlGameLog = await getTodaysNHLGameLog();
        const nbaGameLog = await getTodaysNBAGameLog();
        const mlbGameLog = await getTodaysMLBGameLog();

        return {
            NHL: nhlGameLog,
            NBA: nbaGameLog,
            MLB: mlbGameLog
        };
    } catch (error) {
        throw new Error(`Error fetching all leagues game logs: ${error}`);
    }
}
  
  async function getTodaysNHLGameLog() {
    return getGameLogByLeague("NHL");
  }
  
  async function getTodaysNBAGameLog() {
    return getGameLogByLeague("NBA");
  }
  
  async function getTodaysMLBGameLog() {
    return getGameLogByLeague("MLB");
  }
  
  export default{ getGameLogByLeague, getTodaysNHLGameLog, getTodaysNBAGameLog, getTodaysMLBGameLog, getAllLeaguesGameLogs };