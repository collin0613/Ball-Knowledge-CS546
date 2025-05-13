class ProfileEditor {
    constructor(container) {
        this.state = new Editor();
        this.ui = new EditorInterfaceUI(this.state, container);
        
        const usernameElement = document.getElementById('profile-username');
        this.username = usernameElement ? usernameElement.value : '';
        
        const isCurrentUserElement = document.getElementById('is-current-user');
        this.isCurrentUser = isCurrentUserElement ? isCurrentUserElement.value === 'true' : false;
        this.ui.save = () => {            
            const state = this.state.makeJSON();
            localStorage.setItem('editorState', JSON.stringify(state));
            
            this.saveToServer();
        };
        this.loadFromServer();
        if (!this.isCurrentUser) {
            setTimeout(() => {
                this.hideEditButton();
            }, 300);
        }
    }
    hideEditButton() {
        const editModeToggle = document.querySelector('#edit-mode-toggle');
        if (editModeToggle) {
            editModeToggle.style.display = 'none';
        }
    }
    setMode(mode) {
        const canEdit = this.isCurrentUser && mode;
        this.state.setEditMode(canEdit);

        if (!this.isCurrentUser) {
            this.state.setEditMode(false);
        } else {
            this.state.setEditMode(canEdit);
        }

        if(this.ui) {
            this.ui.setEditUI(this.state.getEditMode());
        }
    }
    saveToServer() {
        if (!this.isCurrentUser) return;
        
        const state = this.state.makeJSON();
        fetch('/api/profile/save-state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Profile saved successfully');
            } else {
                console.error('Error saving profile:', data.error);
            }
        })
        .catch(error => {
            console.error('Error saving profile:', error);
        });
    }
    loadFromServer() {
        fetch(`/api/profile/get-state/${this.username}`)
        .then(response => response.json())
        .then(data => {
            if (data && Object.keys(data).length > 0) {
                const wasEditMode = this.state.getEditMode();
                this.state.loadJSON(data);
                if (!this.isCurrentUser) {
                    this.state.setEditMode(false);
                } else if (wasEditMode) {
                    this.state.setEditMode(wasEditMode);
                }
            } else {
                console.log('No existing profile found, initializing default content');
                this.initDefaultContent();
            }
            
            this.setMode(this.isCurrentUser);
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            this.initDefaultContent();
            this.setMode(this.isCurrentUser);
        });
    }

    initDefaultContent() {
        const welcomeCard = new Card({
            left: 50,
            top: 50,
            width: 700,
            height: 150,
            title: `${username}'s Profile`,
            content: bio ? bio : 'Welcome to your profile! This is a customizable space where you can share whatever you want.',
            userData: this.userData,
            headerBGColor: '#4285f4',
            headerTextColor: '#ffffff',
            contentColor: '#333333'
        });
        this.state.newComponent(welcomeCard);
        welcomeCard.render(this.ui.canvas);
        const statsCard = new Card({
            left: 50,
            top: 220,
            width: 340,
            height: 230,
            title: 'My Stats',
            content: `MMR: ${mmr || 0}\nRank: ${rank || 'Unranked'}\nCredit Balance: ${creditBalance || 0}\nTotal Picks: ${pickHistory ? pickHistory.length : 0}`,
            userData: this.userData,
            headerBGColor: '#3f51b5',
            headerTextColor: '#ffffff',
            contentColor: '#333333'
        });
        this.state.newComponent(statsCard);
        statsCard.render(this.ui.canvas);

        const friendsCard = new Card({
            left: 410,
            top: 220,
            width: 340,
            height: 230,
            title: 'My Friends',
            content: this.formatFriendsList(friends),
            userData: this.userData,
            headerBGColor: '#e91e63',
            headerTextColor: '#ffffff',
            contentColor: '#333333'
        });
        this.state.newComponent(friendsCard);
        friendsCard.render(this.ui.canvas);

        if (pickHistory && pickHistory.length > 0) {
            const pickHistoryCard = new Card({
                left: 50,
                top: 470,
                width: 700,
                height: 250,
                title: 'Recent Picks',
                content: this.formatPickHistory(pickHistory),
                userData: this.userData,
                headerBGColor: '#795548',
                headerTextColor: '#ffffff',
                contentColor: '#333333'
            });
            this.state.newComponent(pickHistoryCard);
            pickHistoryCard.render(this.ui.canvas);
        }
    }
    formatFriendsList(friends) {
        if (!friends || !friends.length) return 'No friends yet';
        
        return friends.slice(0, 10).map(friend => `• ${friend}`).join('\n') + 
               (friends.length > 10 ? `\n... and ${friends.length - 10} more` : '');
    }
    formatPickHistory(pickHistory) {
        if (!pickHistory || !pickHistory.length) return 'No picks yet';
        
        return pickHistory.slice(0, 5).map(pick => {
            if (pick && pick.pick) {
                const parts = pick.pick.split(',');
                if (parts.length >= 4) {
                    const date = parts[0];
                    const team = parts[2];
                    const result = parts[3];
                    return `• ${date} - ${team}: ${result}`;
                }
            }
            return '• Unknown pick';
        }).join('\n') + (pickHistory.length > 5 ? `\n... and ${pickHistory.length - 5} more` : '');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileEditor = new ProfileEditor("#profile-editor");
    window.editor = profileEditor;
    
    const original = window.editor.ui.save;
    if (original) {
        window.editor.ui.save = function() {
            original.call(this);
            window.editor.saveToServer();
        };
    }
});