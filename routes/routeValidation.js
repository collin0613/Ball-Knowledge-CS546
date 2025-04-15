const exportedMethods = {
  checkLeague(strVal) {
    if (!strVal) throw `Error: You must supply a league!`;
    if (typeof strVal !== "string") throw `Error: league must be a string!`;
      
    strVal = strVal.trim();
      
    if (strVal.length === 0) throw `Error: league cannot be an empty string or string with just spaces`;
  
    if(strVal !== "icehockey_nhl" && strVal !== "basketball_nba" && strVal !== "baseball_mlb"){
      throw `Error: ${strVal} is not a valid league. Only 'icehockey_nhl', 'basketball_nba', and 'baseball_mlb' are allowed.`;
      
    }
    return strVal;
    
  }
}
  
  export default exportedMethods;
  
