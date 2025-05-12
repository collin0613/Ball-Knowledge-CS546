(function () {
  const friendForms = document.getElementsByClassName('addFriendForm');
  const errorMessage = document.getElementById('addFriendError');

  for (let i = 0; i < friendForms.length; i++) {
    const form = friendForms[i];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      errorMessage.hidden = true;
      const usernameInput = form.elements.friendUsername;
      const friendUsername = usernameInput?.value?.trim();
      if (!friendUsername) {
        errorMessage.hidden = false;
        errorMessage.textContent = 'Invalid friend username.';
      }
    });
    form.submit();
  }
})();
