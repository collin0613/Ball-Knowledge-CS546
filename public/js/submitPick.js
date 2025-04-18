;;  Client-side JavaScript here, will need for processing submit forms for users selecting their picks.
;; Taken structure from lab9 and lecture code, update for HTML

(function () {
    const submitPickForm = document.getElementById('submitPickForm');
    const pickInput = document.getElementById('pickInput'); // In lab9, input was of type text, perhaps we have a "Pick This Team" button under every matchup instead of dealing with user text input of a team
    const errorMessage = document.getElementById('error');
    if (arraySortForm) {
    arraySortForm.addEventListener('submit', (event) => {
        event.preventDefault();
    try {
      if (pickInput.value.trim()) {
        /* Implement */
      } else {
        throw new Error("You must provide a valid input");
      }
    } catch (e) {
        pickInput.value = '';
        errorMessage.hidden = false;
        errorMessage.innerHTML = e;
        pickInput.className = 'error';
        pickInput.focus();
        pickInput.className = 'inputClass'; 
      }
    });
    }
})();
