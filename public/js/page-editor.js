class ProfileEditor {
    constructor(container) {
        this.state = new Editor();
        this.ui = new EditorInterfaceUI(this.state, container);

        this.initComponents();
        console.log("ProfileEditor initialized");
    }
    initComponents() {

    }
    setMode(mode) {
        this.state.setEditMode(mode);

        if(this.ui) {
            this.ui.setEditUI(this.state.getEditMode());
        }
    }
    initDefaultContent() {
        const card = new Card({
            left: 100,
            top: 100,
            width: 200,
            height: 300,
            title: 'My Card',
            content: 'This is a custom card.',
        });
        this.state.newComponent(card);
        card.render(this.ui.canvas);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileEditor = new ProfileEditor("#profile-editor");
    setTimeout(() => {
        profileEditor.initDefaultContent();
        profileEditor.setMode(false);
        window.editor = profileEditor;
        console.log("ProfileEditor instance created and default content initialized");
    }, 100);
});