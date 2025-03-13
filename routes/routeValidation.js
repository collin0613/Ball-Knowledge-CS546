const exportedMethods = {
    checkLeague(strVal) {
      if (!strVal) throw `Error: You must supply a league!`;
      if (typeof strVal !== "string") throw `Error: league must be a string!`;
      
      strVal = strVal.trim().toUpperCase();
      
      if (strVal.length === 0)
        throw `Error: league cannot be an empty string or string with just spaces`;
  
      if (!["NHL", "NBA", "MLB"].includes(strVal))
        throw `Error: ${strVal} is not a valid league. Only 'NHL', 'NBA', and 'MLB' are allowed.`;
      
      return strVal;
    }
  };
  
  export default exportedMethods;
  