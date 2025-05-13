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
                this.state.loadJSON(data);
                this.state.setEditMode(false);
            } else {
                console.log('No existing profile found, initializing default content');
                this.initDefaultContent();
            }
            
            this.setMode(false);
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            this.setMode(false);
        });
    }

    initDefaultContent() {
        const username = this.username || 'User';
        
        const userData = {
            username: username,
            mmr: 0,
            rank: 'Unranked',
            creditBalance: 0,
            friends: [],
            pickHistory: [],
            bio: 'Welcome to your profile!'
        };
        
        this.userData = userData;
        
        const welcomeCard = new Card({
            left: 50,
            top: 50,
            width: 700,
            height: 150,
            title: `${username}'s Profile`,
            content: `Welcome to {{username}}'s profile! MMR: {{mmr}}, Rank: {{rank}}`,
            userData: userData,
            headerBGColor: '#4285f4',
            headerTextColor: '#ffffff',
            contentColor: '#333333'
        });

        this.state.newComponent(welcomeCard);
        welcomeCard.render(this.ui.canvas);
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