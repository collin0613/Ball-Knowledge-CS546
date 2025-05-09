
(function () {
    const submitPickForm = document.getElementById('submitPickForm');
    const selectTeamPick = document.getElementById('selectTeamPick'); 
    const errorMessage = document.getElementById('pickError');
    const confirmButton = document.getElementById('confirmSubmitPickButton');
    const submitButton = document.getElementById('submitPickButton');
    confirmButton.hidden = true;
    const pickMessage = document.getElementById('pickMessage');
    pickMessage.hidden = true;
    let confirmed = false;
    if (submitPickForm) {
    submitPickForm.addEventListener('submit', (event) => {
        event.preventDefault();
    try {
      if (selectTeamPick.value.trim()) {
        let teamOdds;
        let teamName;
        if (event.srcElement[0][0].selected) { // selected option: optionAwayTeam
          teamName = document.getElementById("awayTeam").value;
          teamOdds = document.getElementById("awayOdds").value;
        } else if (event.srcElement[0][1].selected) { // selected option: optionHomeTeam
          teamName = document.getElementById("homeTeam").value;
          teamOdds = document.getElementById("homeOdds").value;
        } else {
          throw new Error('Unknown error: could not assign teamOdds to pick.');
        }
        const creditAmount = document.getElementById('creditsInput').valueAsNumber;
        const creditBalance = parseInt(document.getElementById("creditBalance").value);
        if (!creditAmount) throw new Error('Unknown error: Could not retrieve credit input amount.');
        if (isNaN(creditAmount) || creditAmount <= 0) throw new Error('Error: credit amount must be a positive number.');
        if (creditAmount > creditBalance) throw new Error(`Error: credit amount exceeds your balance of ${creditBalance}.`); 
        
        if (!confirmed) {
          confirmButton.hidden = false;
          submitButton.hidden = true;
          confirmed = true;
          return;
        }
        pickMessage.hidden = false;
        pickMessage.innerHTML = `Your ${creditAmount} credit pick for the ${teamName} has been placed!`;
        submitPickForm.submit();
        //todo: update the user's creditBalance in the db to subtract the creditAmount of the wager --> tried to implement in router/views/matchups.js with POST /matchups/:league/:gameUID/submitPick (Collin)
        
      } else {
        throw new Error("You must provide a valid input");
      }
    } catch (e) {
        selectTeamPick.value = '';
        errorMessage.hidden = false;
        errorMessage.innerHTML = e;
        selectTeamPick.className = 'error';
        selectTeamPick.focus();
        selectTeamPick.className = 'inputClass'; 
        confirmButton.hidden = true;
        submitButton.hidden = false;
      }
    });
    }
})();
