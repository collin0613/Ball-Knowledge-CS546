import Filter from 'bad-words';
(function () {
    const submitCommentForm = document.getElementById('postCommentForm');
    const commentInput = document.getElementById('commentInput');
    const errorMessage = document.getElementById('commentError');
    if (submitCommentForm) {
    submitCommentForm.addEventListener('submit', (event) => {
        event.preventDefault();
    try {
      if (commentInput.value.trim()) {
        const comment = commentInput.value;
        errorMessage.hidden = true;
        try {
            if (comment.length > 256) throw new Error(`Comment length: ${comment.length}/256`)
        } catch(e) {
            // Gets its own try-catch block so the comment input is not cleared upon exceeding length
            errorMessage.hidden = false;
            errorMessage.innerHTML = e;
            commentInput.className = 'error';
            commentInput.focus();
            commentInput.className = 'inputClass'; 
        }
        const profanityFilter = new Filter();
        if (profanityFilter.isProfane(comment)) throw new Error("Profanity was detected in your comment.");
        submitCommentForm.submit();
        // todo: add comment to game --> tried to implement in router post matchups/:league/:gameUID/submitComment (Collin)
      } else {
        throw new Error("You must provide a valid input");
      }
    } catch (e) {
        commentInput.value = '';
        errorMessage.hidden = false;
        errorMessage.innerHTML = e;
        commentInput.className = 'error';
        commentInput.focus();
        commentInput.className = 'inputClass'; 
      }
    });
    }
})();