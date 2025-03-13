const exportedMethods = {
    checkLeague(strVal, varName) {
      if (!strVal) throw `Error: You must supply a ${varName}!`;
      if (typeof strVal !== "string") throw `Error: ${varName} must be a string!`;
      
      strVal = strVal.trim().toUpperCase();
      
      if (strVal.length === 0)
        throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  
      if (!["NHL", "NBA", "MLB"].includes(strVal))
        throw `Error: ${strVal} is not a valid ${varName}. Only 'NHL', 'NBA', and 'MLB' are allowed.`;
      
      return strVal;
    }
  };
  
  export default exportedMethods;
  