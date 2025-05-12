import Filter from 'bad-words';
(function () {
    const submitCommentForm = document.getElementById('postCommentForm');
    const commentInput = document.getElementById('commentInput');
    const errorMessage = document.getElementById('commentError');
    
    if (submitCommentForm) {
        submitCommentForm.addEventListener('submit', (event) => {
            let isValid = true;
            errorMessage.hidden = true;

            console.log("Comment input value:", commentInput.value);

            if (!commentInput.value.trim()) {
                errorMessage.hidden = false;
                errorMessage.innerHTML = "You must provide a valid input";
                commentInput.className = 'error';
                commentInput.focus();
                commentInput.className = 'inputClass'; 
                isValid = false;
            }
            
            if (commentInput.value.length > 256) {
                errorMessage.hidden = false;
                errorMessage.innerHTML = `Comment length: ${commentInput.value.length}/256`;
                commentInput.className = 'error';
                commentInput.focus();
                commentInput.className = 'inputClass'; 
                isValid = false;
            }
            
            try {
                const profanityFilter = new Filter();
                if (profanityFilter.isProfane(commentInput.value)) {
                    errorMessage.hidden = false;
                    errorMessage.innerHTML = "Profanity was detected in your comment.";
                    commentInput.className = 'error';
                    commentInput.focus();
                    commentInput.className = 'inputClass'; 
                    isValid = false;
                }
            } catch (e) {
                console.error("Error with profanity filter:", e);
            }
            
            if (!isValid) { // changed to only prevent default if there is an inssue with validation
                event.preventDefault();
            }
        });
    }
})();