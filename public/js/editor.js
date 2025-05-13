class Editor {
    constructor() {
        this.components = {};
        this.log = [];
        this.idxLog = -1;
        this.logLimit = 100;
        this.listeners = [];
        this.editMode = false;
        this.selectedComponentsIdx = [];
    }
    newComponent(component) {
        this.components[component.id] = component;
        this.logChange({
            type: 'new',
            id: component.id,
            component: component.makeJSON(),
        });
        this.triggerListeners({
            type: 'new',
            component
        })
        return component;
    }
    updateComponent(id, config) {
        const component = this.components[id];
        if (!component) {
            console.error(`Component id: ${id} not found`);
            return null;
        }
        const originalConfig = component.makeJSON();
        const wasSelected = component.selected;
        component.configure(config);
        if (component.type === 'card' &&
            (config.title !== undefined || config.content !== undefined ||
                config.headerBGColor !== undefined || config.headerTextColor !== undefined ||
                config.contentColor !== undefined)) {

            this.rerenderComponent(component);
        }

        if (component.type === 'image' && 
            (config.src !== undefined || config.alt !== undefined || 
             config.objectFit !== undefined)) {
            
            this.rerenderComponent(component);
        }
        if (wasSelected && component.reference) {
            component.selected = true;
            component.reference.classList.add('selected');
        }

        this.logChange({
            type: 'update',
            id,
            originalConfig,
            newConfig: component.makeJSON(),
        });

        this.triggerListeners({
            type: 'update',
            component,
            config
        });
        this.rerenderComponent(component);
        return component;
    }
    rerenderComponent(component) {
        if (!component.reference || !component.reference.parentNode) {
            return;
        }
        
        const parent = component.reference.parentNode;
        const wasSelected = component.selected;
        
        component.hide();
        
        component.render(parent);
        
        if (wasSelected && component.reference) {
            component.selected = true;
            component.reference.classList.add('selected');
        }
    }
    
    removeComponent(id) {
        const component = this.components[id];
        if (!component) {
            console.error(`Component id: ${id} not found`);
            return null;
        }
        const originalConfig = component.makeJSON();
        component.hide();
        delete this.components[id];
        this.logChange({
            type: 'remove',
            id,
            originalConfig,
        });

        this.triggerListeners({
            type: 'remove',
            id
        });
        return true;
    }
    getComponent(id) {
        return this.components[id];
    }
    getComponents() {
        return Object.values(this.components);
    }
    selectComponent(id, addSelection = true) {
        const component = this.components[id];
        if (!component) {
            console.error(`Component id: ${id} not found`);
            return false;
        }
        if (!addSelection) {
            this.removeSelection();
        }

        if (!this.isSelected(id)) {
            this.selectedComponentsIdx.push(id);
            component.selected = true;
            if (component.reference) {
                component.reference.classList.add('selected');
            }

            this.triggerListeners({
                type: 'select',
                id
            });
        }
        return true;
    }
    unselectComponent(id) {
        const i = this.selectedComponentsIdx.indexOf(id);
        if (i === -1) {
            return false;
        }

        this.selectedComponentsIdx.splice(i, 1);
        const component = this.components[id];

        if (component) {
            component.selected = false;
            if (component.reference) {
                component.reference.classList.remove('selected');
            }
        }
        this.triggerListeners({
            type: 'unselect',
            id
        });

        return true;
    }
    removeSelection() {
        this.selectedComponentsIdx.forEach(id => {
            const component = this.components[id];
            if (component) {
                component.selected = false;
                if (component.reference) {
                    component.reference.classList.remove('selected');
                }
            }
        });

        const originalSelected = [...this.selectedComponentsIdx];
        this.selectedComponentsIdx = [];
        if (originalSelected.length > 0) {
            this.triggerListeners({
                type: 'selectionRemoved',
                originalSelected
            });
        }
        return true;
    }
    isSelected(id) {
        return this.selectedComponentsIdx.includes(id);
    }
    getSelectedComponents() {
        return this.selectedComponentsIdx.map(id => this.components[id]).filter(Boolean);
    }

    setEditMode(editMode) {
        if (this.editMode === editMode) {
            return false;
        }
        this.editMode = editMode;
        this.triggerListeners({
            type: 'editMode',
            editMode
        });
        return true;
    }
    getEditMode() {
        return this.editMode;
    }
    undo() {
        if (this.idxLog <= 0) {
            return false;
        }
        this.idxLog--;
        const log = this.log[this.idxLog];
        this.undoAction(log);
        this.triggerListeners({
            type: 'undo',
            log
        });
        return true;
    }
    redo() {
        if (this.idxLog >= this.log.length - 1) {
            return false;
        }
        const log = this.log[this.idxLog + 1];
        this.idxLog++;
        this.redoAction(log);
        this.triggerListeners({
            type: 'redo',
            log
        });
        return true;
    }
    makeJSON() {
        const components = {};
        Object.keys(this.components).forEach(key => {
            components[key] = this.components[key].makeJSON();
        });
        return {
            components,
            selectedComponentsIdx: this.selectedComponentsIdx,
            editMode: this.editMode,
        };
    }
    loadJSON(json) {
        this.resetState();
        Object.keys(json.components).forEach(id => {
            const component = json.components[id];
            let newComponent;
            switch (component.type) {
                case 'card':
                    newComponent = Card.makeComponent(component);
                    break;
                case 'image':
                    newComponent = Image.makeComponent(component);
                    break;
                default:
                    newComponent = CustomComponent.makeComponent(component);
            }
            this.components[newComponent.id] = newComponent;
        });
        this.editMode = json.editMode || false;
        this.selectedComponentsIdx = json.selectedComponentsIdx || [];
        this.log = [];
        this.idxLog = -1;
        this.triggerListeners({
            type: 'loadJSON',
            json
        });
    }
    resetState() {
        Object.values(this.components).forEach(component => {
            component.hide();
        });
        this.components = {};
        this.selectedComponentsIdx = [];
        this.log = [];
        this.idxLog = -1;
        this.triggerListeners({
            type: 'resetState'
        });
    }
    addListener(listener) {
        if (typeof listener !== 'function') {
            console.error('Listener is not a function');
            return false;
        }
        this.listeners.push(listener);
        return true;
    }
    removeListener(listener) {
        const i = this.listeners.indexOf(listener);
        if (i === -1) {
            return false;
        }
        this.listeners.splice(i, 1);
        return true;
    }
    triggerListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (e) {
                console.error('Error in listener', e);
            }
        });
    }
    logChange(log) {
        if (this.idxLog < this.log.length - 1) {
            this.log = this.log.slice(0, this.idxLog + 1);
        }
        this.log.push(log);
        this.idxLog++;
        if (this.log.length > this.logLimit) {
            this.log.shift();
            this.idxLog--;
        }
    }
    undoAction(log) {
        switch (log.type) {
            case 'new':
                const component = this.components[log.id];
                if (component) {
                    component.hide();
                    delete this.components[log.id];
                }
                break;
            case 'remove':
                let newComponent;
                switch (log.originalConfig.type) {
                    case 'card':
                        newComponent = Card.makeComponent(log.originalConfig);
                        break;
                    case 'image':
                        newComponent = Image.makeComponent(log.originalConfig);
                        break;
                    default:
                        newComponent = CustomComponent.makeComponent(log.originalConfig);
                }
                this.components[newComponent.id] = newComponent;
                break;
            case 'update':
                const componentToUpdate = this.components[log.id];
                if (componentToUpdate) {
                    componentToUpdate.configure(log.originalConfig);
                }
                break;
        }
    }
    redoAction(log) {
        switch (log.type) {
            case 'new':
                let newComponent;
                switch (log.component.type) {
                    case 'card':
                        newComponent = Card.makeComponent(log.component);
                        break;
                    case 'image':
                        newComponent = Image.makeComponent(log.component);
                        break;
                    default:
                        newComponent = CustomComponent.makeComponent(log.component);
                }
                this.components[newComponent.id] = newComponent;
                break;
            case 'remove':
                const component = this.components[log.id];
                if (component) {
                    component.hide();
                    delete this.components[log.id];
                }
                break;
            case 'update':
                const componentToUpdate = this.components[log.id];
                if (componentToUpdate) {
                    componentToUpdate.configure(log.newConfig);
                }
                break;
        }
    }
    dragUpdate(id, config) {
        const component = this.components[id];
        if (!component) {
            console.error(`Component id: ${id} not found`);
            return null;
        }
        
        const wasSelected = component.selected;
        component.configure(config);

        this.rerenderComponent(component);
        
        if (component.type === 'card' &&
            (config.title !== undefined || config.content !== undefined ||
                config.headerBGColor !== undefined || config.headerTextColor !== undefined ||
                config.contentColor !== undefined)) {
            this.rerenderComponent(component);
        }
    
        if (component.type === 'image' && 
            (config.src !== undefined || config.alt !== undefined || 
             config.objectFit !== undefined)) {
            this.rerenderComponent(component);
        }
        
        if (wasSelected && component.reference) {
            component.selected = true;
            component.reference.classList.add('selected');
        }
    
        this.triggerListeners({
            type: 'update',
            component,
            config
        });
    
        return component;
    }
    startDragUpdate(id) {
        const component = this.components[id];
        if (!component) {
            return null;
        }
        
        return component.makeJSON();
    }
    endDragUpdate(id, originalConfig) {
        const component = this.components[id];
        if (!component || !originalConfig) {
            return;
        }
        
        this.logChange({
            type: 'update',
            id,
            originalConfig,
            newConfig: component.makeJSON()
        });
    }
}

class EditorInterfaceUI {
    constructor(editor, container) {
        this.state = editor;
        this.container = document.querySelector(container);

        if (!this.container) {
            console.error(`Container ${container} not found`);
            return;
        }
        this.canvas = null;
        this.toolbar = null;
        this.properties = null;
        this.components = null;
        this.init();
        this.initListeners();
    }
    init() {
        this.container.innerHTML = '';
        this.container.innerHTML = `
            <div class="editor-container">
                <div class="editor-toolbar"></div>
                <div class="editor-main">
                    <div class="editor-canvas"></div>
                    <div class="editor-components-container">
                        <div class="editor-components"></div>
                        <div class="panel-toggle components-toggle">›</div>
                    </div>
                    <div class="editor-properties-container">
                        <div class="panel-toggle properties-toggle">‹</div>
                        <div class="editor-properties"></div>
                    </div>
                </div>
            </div>
        `;
    
        this.toolbar = this.container.querySelector('.editor-toolbar');
        this.canvas = this.container.querySelector('.editor-canvas');
        this.properties = this.container.querySelector('.editor-properties');
        this.propertiesContainer = this.container.querySelector('.editor-properties-container');
        this.components = this.container.querySelector('.editor-components');
        this.componentsContainer = this.container.querySelector('.editor-components-container');
        
        this.initToolbar();
        this.initCanvas();
        this.initProperties();
        this.initComponents();
        this.initPanelToggles();
        this.style();
        this.initKeybinds();
    }
    initPanelToggles() {
        const componentsToggle = this.container.querySelector('.components-toggle');
        const propertiesToggle = this.container.querySelector('.properties-toggle');
        
        componentsToggle.addEventListener('click', () => {
            this.togglePanel('components');
        });
        
        propertiesToggle.addEventListener('click', () => {
            this.togglePanel('properties');
        });
    }
    togglePanel(panelType) {
        if (panelType === 'components') {
            const isCollapsed = this.componentsContainer.classList.toggle('collapsed');
            const toggle = this.componentsContainer.querySelector('.components-toggle');
            toggle.textContent = isCollapsed ? '‹' : '›';
        } else if (panelType === 'properties') {
            const isCollapsed = this.propertiesContainer.classList.toggle('collapsed');
            const toggle = this.propertiesContainer.querySelector('.properties-toggle');
            toggle.textContent = isCollapsed ? '›' : '‹';
        }
    }
    style() {
        if (document.getElementById('editor-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'editor-styles';
        style.textContent = `
            .editor-container {
                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
                width: 100% !important;
                overflow: hidden !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                position: relative !important;
            }
            .editor-toolbar {
                background-color: #1A181C !important;
                padding: 10px !important;
                display: flex !important;
                align-items: center !important;
                position: fixed !important;
                top: 120px !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 30 !important;
            }
            .editor-main {
                display: flex !important;
                flex: 1 !important;
                overflow: hidden !important
                height: 100% !important;
                margin-top: 0px !important;
                bottom: 0 !important;
            }
            .editor-canvas {
                flex: 1 !important;
                position: relative !important;
                overflow: auto !important;
                background-color: #ffffff !important;
                height: 100% !important; 
                margin-left: 0 !important;
                margin-right: 0 !important;
                bottom: 0 !important;
            }
            .editor-components-container {
                position: fixed !important;
                left: 0 !important;
                top: 181px !important;
                bottom: 0 !important;
                width: 250px !important;
                display: flex !important;
                transition: transform 0.3s ease !important;
                z-index: 20 !important;
            }
            .editor-properties-container {
                position: fixed !important;
                right: 0 !important;
                top: 181px !important; 
                bottom: 0 !important;
                width: 300px !important;
                display: flex !important;
                transition: transform 0.3s ease !important;
                z-index: 20 !important;
            }
            .editor-properties {
                width: 100% !important;
                padding: 10px !important;
                border-left: 1px solidrgb(0, 0, 0) !important;
                overflow-y: auto !important;
                background-color: #22262C !important;
                height: auto !important;
                max-height: 100% !important;
                box-shadow: -2px 0 5px rgba(0,0,0,0.1) !important;
            }
            .editor-components {
                width: 100% !important;
                padding: 10px !important;
                border-right: 1px solidrgb(0, 0, 0) !important;
                overflow-y: auto !important;
                background-color: #22262C !important;
                height: auto !important;
                max-height: 100% !important;
                box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
            }
            .editor-components-container.collapsed {
                transform: translateX(-100%) !important;
            }
            .components-toggle {
                right: -30px !important;
            }
            .editor-properties-container.collapsed {
                transform: translateX(100%) !important;
            }
            .properties-toggle {
                left: -30px !important;
            }
            .panel-toggle {
                width: 30px !important;
                height: 60px !important;
                background-color: #f0f0f0 !important;
                border: 1px solid #dddddd !important;
                border-radius: 4px 0 0 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                position: absolute !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                cursor: pointer !important;
                z-index: 5 !important;
                font-size: 20px !important;
                font-weight: bold !important;
                color: #555 !important;
            }
            .panel-toggle:hover {
                background-color: #e0e0e0 !important;
            }
            .editor-button {
                background-color: #1A181C !important;
                color: #E1E2EF !important;
                border: none !important;
                padding: 10px 20px !important;
                cursor: pointer !important;
                border-radius: 5px !important;
                margin-right: 10px !important;
                font-size: 14px !important;
            }
            .editor-button:hover {
                background-color: #343038 !important;
            }
            .editor-button.active {
                background-color: #3B3342 !important;
            }
            .editor-button.prim {
                background-color: #D53E3E !important;
            }
            .editor-button.prim:hover {
                background-color: #D5733E !important;
            }
            .editor-button.prim.active {
                background-color: #55D53E !important;
            }
            .editor-button.danger {
                background-color: #dc3545 !important;
            }
            .editor-button.danger:hover {
                background-color: #c82333 !important;
            }
            .component {
                border: 1px solid #dddddd !important;
                padding: 10px !important;
                margin-bottom: 10px !important;
                border-radius: 5px !important;
                background-color: #ffffff !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
            }
            .component:hover {
                background-color: #f0f0f0 !important;
                border-color: #cccccc !important;
            }
            .editor-component {
                box-sizing: border-box !important;
                user-select: none !important;
            }
            .editor-component.selected {
                outline: 2px solid #007bff !important;
                z-index: 1000 !important;
            }
            .editor-component.dragging {
                opacity: 0.8 !important;
                cursor: move !important;
            }
            .editor-component.resizing {
                opacity: 0.8 !important;
            }
            
            .editor-component.selected:hover {
                cursor: move !important;
            }
            .resize-handle {
                position: absolute !important;
                width: 8px !important;
                height: 8px !important;
                background-color: #007bff !important;
                border: 1px solid #ffffff !important;
                z-index: 1001 !important;
            }
            .resize-top-left {
                top: -4px !important;
                left: -4px !important;
                cursor: nwse-resize !important;
            }
            .resize-top {
                top: -4px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                cursor: ns-resize !important;
            }
            .resize-top-right {
                top: -4px !important;
                right: -4px !important;
                cursor: nesw-resize !important;
            }        
            .resize-left {
                top: 50% !important;
                left: -4px !important;
                transform: translateY(-50%) !important;
                cursor: ew-resize !important;
            }
            .resize-right {
                top: 50% !important;
                right: -4px !important;
                transform: translateY(-50%) !important;
                cursor: ew-resize !important;
            }
            .resize-bottom-left {
                bottom: -4px !important;
                left: -4px !important;
                cursor: nesw-resize !important;
            }
            .resize-bottom {
                bottom: -4px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                cursor: ns-resize !important;
            }
            .resize-bottom-right {
                bottom: -4px !important;
                right: -4px !important;
                cursor: nwse-resize !important;
            }
            .property-group {
                border: 1px solid #070707 !important;
                border-radius: 5px !important;
                margin-bottom: 10px !important;
                overflow: hidden !important;
            }
            .property-group-header {
                background-color: #343038 !important;
                color: #F2F1E9 !important;
                padding: 10px !important;
                font-weight: bold !important;
                border-bottom: 1px solid #dddddd !important;
                cursor: pointer !important;
            }
            .property-group-content {
                background-color:rgb(76, 71, 81) !important;
                color: #F2F1E9 !important;
                padding: 10px !important;
            }
            .property-row {
                margin-bottom: 10px !important;
                color: #F2F1E9 !important;
            }
            .property-label {
                display: block !important;
                margin-bottom: 5px !important;
                font-size: 14px !important;
                color: #F2F1E9 !important;
                font-weight: bold !important;
                font-style: italic !important;
            }
            .property-input {
                width: 100% !important;
                padding: 5px !important;
                border: 1px solid #524b51 !important;
                border-radius: 5px !important;
                font-size: 14px !important;
                background-color: #c1c1c1 !important;
                color:#494949 !important;
            }
            .property-input, input, textarea, select {
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
            }
            .card-content {
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
            }
            .editor-container:not(.edit-mode) .editor-button:not(#edit-mode-toggle),
            .editor-container:not(.edit-mode) .editor-properties-container,
            .editor-container:not(.edit-mode) .editor-components-container {
                display: none !important;
            }

            .editor-container:not(.edit-mode) .editor-component {
                outline: none !important;
                cursor: default !important;
            }
            .editor-container:not(.edit-mode) .editor-toolbar {
                background-color: transparent !important;
                border-bottom: none !important;
                padding: 5px !important;
                position: fixed !important;
                top: 120px !important;
                right: 0 !important;
                z-index: 9 !important;
            }
            .editor-container.edit-mode .editor-toolbar {
                box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
            }
            .editor-container:not(.edit-mode) .resize-handle {
                display: none !important;
            }
            .component-title {
                font-size: 18px !important;
                font-weight: bold !important;
                margin-bottom: 5px !important;
                color: #F2F1E9 !important;
                border-bottom: 1px solid #dddddd !important;
            }
            .component-description {
                font-size: 12px !important;
                margin-bottom: 5px !important;
                color:rgb(167, 167, 167) !important;
            }
        `;
        document.head.appendChild(style);
    }
    initKeybinds() {
        document.addEventListener('keydown', (e) => {
            if(!this.state.getEditMode()) {
                return;
            }

            const activeElement = document.activeElement;
            const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT';
            
            if (isInput) {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const selectedComponents = this.state.getSelectedComponents();
            
                if (selectedComponents.length > 0) {
                    if (!confirm('Are you sure you want to delete selected components?')) {
                        return;
                    }
                    
                    selectedComponents.forEach(component => {
                        this.state.removeComponent(component.id);
                    });
                    
                    e.preventDefault();
                }
            }
        });
    }
    initToolbar() {
        this.toolbar.innerHTML = `
            <button id="edit-mode-toggle" class="editor-button prim">Edit Mode: OFF</button>
            <button id="add-component" class="editor-button">Add Component</button>
            <button id="add-image" class="editor-button">Add Image</button>
            <div style="flex: 1;"></div>
            <button id="undo" class="editor-button">Undo</button>
            <button id="redo" class="editor-button">Redo</button>
            <button id="save" class="editor-button">Save</button>
        `;

        const editModeToggle = this.toolbar.querySelector('#edit-mode-toggle');
        editModeToggle.addEventListener('click', () => {
            const newMode = !this.state.getEditMode();
            this.state.setEditMode(newMode);
            editModeToggle.textContent = `Edit Mode: ${newMode ? 'ON' : 'OFF'}`;
            editModeToggle.classList.toggle('active', newMode);
            this.setEditUI(newMode);
        });
        const addComponentButton = this.toolbar.querySelector('#add-component');
        addComponentButton.addEventListener('click', () => {
            if (this.state.getEditMode()) {
                this.addComponent('card')
            }
        });
        const addImageButton = this.toolbar.querySelector('#add-image');
        addImageButton.addEventListener('click', () => {
            if (this.state.getEditMode()) {
                this.addImagePanel('image');
            }
        });
        const undoButton = this.toolbar.querySelector('#undo');
        undoButton.addEventListener('click', () => this.state.undo());
        const redoButton = this.toolbar.querySelector('#redo');
        redoButton.addEventListener('click', () => this.state.redo());
        const saveButton = this.toolbar.querySelector('#save');
        saveButton.addEventListener('click', () => this.save());
    }

    initComponents() {
        this.components.innerHTML = `
            <h3 class="component-title">Components</h3>
            <p class="component-description"><i>Drag and drop components to the canvas</i></p>
            <div class="component" data-type="card">
                <h4>Card</h4>
                <p>Add a card component</p>
            </div>
            <div class="component" data-type="image">
                <h4>Image</h4>
                <p>Add an image component</p>
            </div>
        `;
        this.initDragAndDrop();
    }
    initProperties() {
        this.properties.innerHTML = `
            <h3 class="component-title">Properties</h3>
            <div id="no-selection" class="component-description">No selected component</div>
            <div id="properties-form" style="display: none;"></div>
        `;
    }
    initCanvas() {
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                if (this.state.getEditMode()) {
                    this.state.removeSelection();
                }
            }
        });
        this.canvas.addEventListener('click', (e) => {
            const component = e.target.closest('.editor-component');
            if (component) {
                const id = component.getAttribute('component-id');
                const c = this.state.getComponent(id);
                if (c && !c.locked && this.state.getEditMode()) {
                    const addSelection = e.shiftKey;
                    this.state.selectComponent(id, addSelection);
                    e.stopPropagation();
                }
            }
        });
        this.initDraggables();
        this.initResizeables();
    }
    initDraggables() {
        let dragged = null;
        let startX, startY, initialLeft, initialTop;
        let og = null;
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.state.getEditMode()) {
                return;
            }
            
            const component = e.target.closest('.editor-component');
            if (!component) {
                return;
            }
            
            const id = component.getAttribute('component-id');
            const comp = this.state.getComponent(id);
            
            if (!comp || comp.locked) {
                return;
            }
            
            if (e.target.classList.contains('resize-handle')) {
                return;
            }
            
            if (!this.state.isSelected(id)) {
                const addSelection = e.shiftKey;
                this.state.selectComponent(id, addSelection);
            }
            og = this.state.startDragUpdate(id);
            
            dragged = comp;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = comp.left;
            initialTop = comp.top;
            
            component.classList.add('dragging');
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragged) {
                return;
            }
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.state.dragUpdate(dragged.id, {
                left: initialLeft + deltaX,
                top: initialTop + deltaY
            });
            if(window.gsap) {
                gsap.to(dragged.reference, {
                    duration: 0.1,
                    ease: "power1.out",
                    left: initialLeft + deltaX,
                    top: initialTop + deltaY
                });
            }
            
            e.preventDefault();
        });

        document.addEventListener('mouseup', (e) => {
            if (!dragged) {
                return;
            }

            this.state.endDragUpdate(dragged.id, og);
            
            if (dragged.reference) {
                dragged.reference.classList.remove('dragging');
            }
            
            dragged = null;
            og = null;
        });
    
    }
    addResizeHandles(component) {
        if (!component.reference || !this.state.getEditMode()) {
            return;
        }
        
        this.removeResizeHandles(component);
        
        const positions = [
            'top-left', 'top', 'top-right',
            'left', 'right',
            'bottom-left', 'bottom', 'bottom-right'
        ];
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${pos}`;
            handle.setAttribute('data-handle', pos);
            component.reference.appendChild(handle);
        });
    }
    removeResizeHandles(component){
        if (!component.reference) {
            return;
        }
        
        const handles = component.reference.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());
    };
    initResizeables() {
        let resizing = null;
        let resizeHandle = null;
        let startX, startY;
        let initialWidth, initialHeight, initialLeft, initialTop;
        let og = null;
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.state.getEditMode()) {
                return;
            }
            
            if (e.target.classList.contains('resize-handle')) {
                const component = e.target.closest('.editor-component');
                if (!component) {
                    return;
                }
                
                const id = component.getAttribute('component-id');
                const comp = this.state.getComponent(id);
                
                if (!comp || comp.locked) {
                    return;
                }

                og = this.state.startDragUpdate(id);
                
                resizing = comp;
                resizeHandle = e.target.getAttribute('data-handle');
                startX = e.clientX;
                startY = e.clientY;
                initialWidth = comp.width;
                initialHeight = comp.height;
                initialLeft = comp.left;
                initialTop = comp.top;
                
                component.classList.add('resizing');
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!resizing || !resizeHandle) {
                return;
            }
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let newWidth = initialWidth;
            let newHeight = initialHeight;
            let newLeft = initialLeft;
            let newTop = initialTop;
            
            if (resizeHandle.includes('right')) {
                newWidth = initialWidth + deltaX;
            }
            if (resizeHandle.includes('bottom')) {
                newHeight = initialHeight + deltaY;
            }
            if (resizeHandle.includes('left')) {
                newWidth = initialWidth - deltaX;
                newLeft = initialLeft + deltaX;
            }
            if (resizeHandle.includes('top')) {
                newHeight = initialHeight - deltaY;
                newTop = initialTop + deltaY;
            }
            
            const minSize = 20;
            if (newWidth < minSize) {
                newWidth = minSize;
                if (resizeHandle.includes('left')) {
                    newLeft = initialLeft + initialWidth - minSize;
                }
            }
            if (newHeight < minSize) {
                newHeight = minSize;
                if (resizeHandle.includes('top')) {
                    newTop = initialTop + initialHeight - minSize;
                }
            }
            
            this.state.dragUpdate(resizing.id, {
                width: newWidth,
                height: newHeight,
                left: newLeft,
                top: newTop
            });
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!resizing) {
                return;
            }

            this.state.endDragUpdate(resizing.id, og);
            
            if (resizing.reference) {
                resizing.reference.classList.remove('resizing');
            }
            
            resizing = null;
            resizeHandle = null;
        });
    }
    initListeners() {
        this.state.addListener((event) => {
            switch (event.type) {
                case 'new':
                    event.component.render(this.canvas);
                    break;
                case 'remove':
                    break;
                case 'update':
                    if (event.component && event.component.reference) {
                        event.component.reference.style.left = `${event.component.left}px`;
                        event.component.reference.style.top = `${event.component.top}px`;
                        event.component.reference.style.width = `${event.component.width}px`;
                        event.component.reference.style.height = `${event.component.height}px`;
                    }
                    break;
                case 'select':
                    const component = this.state.getComponent(event.id);
                    if (component && !component.locked && this.state.getEditMode()) {
                        this.addResizeHandles(component);
                    }
                    this.updateProperties();
                    break;
                case 'unselect':
                    const unselectedComponent = this.state.getComponent(event.id);
                    if (unselectedComponent) {
                        this.removeResizeHandles(unselectedComponent);
                    }
                    this.updateProperties();
                    break;
                case 'selectionRemoved':
                    event.originalSelected.forEach(id => {
                        const comp = this.state.getComponent(id);
                        if (comp) {
                            this.removeResizeHandles(comp);
                        }
                    });
                    this.updateProperties();
                    break;
                case 'editMode':
                    this.setEditUI(event.editMode);
                    break;
                case 'undo':
                case 'redo':
                    this.rerender();
                    this.updateProperties();
                    break;
                case 'loadJSON':
                case 'resetState':
                    this.rerender();
                    this.updateProperties();
                    break;
            }
            this.updateButtons();
        });
    }
    setEditUI(editMode) {

        const container = this.container;
        if (!container) {
            console.error('Container not found');
            return;
        }

        const editorContainer = container.querySelector('.editor-container');
        if (!editorContainer) {
            console.error('Editor container not found');
            return;
        }

        if (editMode) {
            editorContainer.classList.add('edit-mode');
            if (this.propertiesContainer) {
                this.propertiesContainer.style.display = 'flex';
            }
            if (this.componentsContainer) {
                this.componentsContainer.style.display = 'flex';
            }
        } else {
            editorContainer.classList.remove('edit-mode');
            if (this.propertiesContainer) {
                this.propertiesContainer.style.display = 'none';
            }
            if (this.componentsContainer) {
                this.componentsContainer.style.display = 'none';
            }
        }

        const editModeToggle = this.toolbar.querySelector('#edit-mode-toggle');
        if (editModeToggle) {
            editModeToggle.textContent = `Edit Mode: ${editMode ? 'ON' : 'OFF'}`;
            if (editMode) {
                editModeToggle.classList.add('active');
            } else {
                editModeToggle.classList.remove('active');
            }
        }
        const components = Object.values(this.state.components);
        components.forEach(component => {
            if (component.reference) {
                if (editMode && component.selected) {
                    this.addResizeHandles(component);
                    component.reference.classList.add('selected');
                } else {
                    this.removeResizeHandles(component);
                    component.reference.classList.remove('selected');
                }

                component.reference.style.pointerEvents = editMode ? 'auto' : 'none';
            }
        });

        const propertyPanel = this.properties;
        const componentsPanel = this.components;

        if (propertyPanel) {
            propertyPanel.style.display = editMode ? 'block' : 'none';
        }

        if (componentsPanel) {
            componentsPanel.style.display = editMode ? 'block' : 'none';
        }
        const toolbarButtons = this.toolbar.querySelectorAll('.editor-button:not(#edit-mode-toggle)');
        toolbarButtons.forEach(button => {
            button.style.display = editMode ? 'inline-block' : 'none';
        });

        return true;
    }
    addComponent(type, config = {}) {
        if (!this.state.getEditMode()) {
            return null;
        }
        const canvasRect = this.canvas.getBoundingClientRect();
        const top = this.canvas.scrollTop;
        const left = this.canvas.scrollLeft;

        const baseleft = Math.max(0, (canvasRect.width / 2) - 150 + left);
        const basetop = Math.max(0, (canvasRect.height / 2) - 100 + top);

        const componentConfig = {
            left: baseleft,
            top: basetop,
        };
        const combinedConfig = { ...componentConfig, ...config };
        let newComponent;
        switch (type) {
            case 'card':
                newComponent = new Card(combinedConfig);
                break;
            case 'image':
                newComponent = new Image(combinedConfig);
                break;
            default:
                newComponent = new CustomComponent({ ...combinedConfig }, type);
        }

        this.state.newComponent(newComponent);
        newComponent.render(this.canvas);
        this.state.selectComponent(newComponent.id);

        return newComponent;
    }
    addImagePanel() {
        if (!document.getElementById('add-image-panel')) {
            const panel = document.createElement('div');
            panel.id = 'add-image-panel';
            panel.className = 'image-panel';
            panel.innerHTML = `
                <div class="image-panel-content">
                    <div class="image-panel-header">
                        <h3>Add Image</h3>
                        <span class="image-panel-close">&times;</span>
                    </div>
                    <div class="image-panel-body">
                        <form id="image-form">
                            <div class="property-row">
                                <label class="property-label" for="image-url">Image URL</label>
                                <input class="property-input" type="url" id="image-url" required placeholder="Enter image URL">
                            </div>
                            <div class="property-row">
                                <label class="property-label" for="image-alt">Image Alt Text</label>
                                <input class="property-input" type="text" id="image-alt" required placeholder="Enter image alt text">
                            </div>
                            <div class="property-row">
                                <label class="property-label" for="image-fit">Image Fit</label>
                                <select class="property-input" id="image-fit">
                                    <option value="contain">Contain</option>
                                    <option value="cover">Cover</option>
                                    <option value="fill">Fill</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                            <div class="property-row">
                                <button type="submit" class="editor-button">Add Image</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
            this.stylePanels();
            const closeButton = panel.querySelector('.image-panel-close');
            closeButton.addEventListener('click', () => {
                panel.style.display = 'none';
            });

            window.addEventListener('click', (e) => {
                if (e.target === panel) {
                    panel.style.display = 'none';
                }
            });
            const form = panel.querySelector('#image-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const url = document.getElementById('image-url').value;
                const alt = document.getElementById('image-alt').value;
                const fit = document.getElementById('image-fit').value;
                this.addComponent('image', { src: url, alt, objectFit: fit });
                panel.style.display = 'none';
                form.reset();
            });
        }
        document.getElementById('add-image-panel').style.display = 'block';
    }
    stylePanels() {
        if (document.getElementById('panel-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'panel-styles';
        style.textContent = `
            .image-panel {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0, 0, 0, 0.5);
            }
            .image-panel-content {
                background-color: #ffffff;
                margin: 15% auto;
                padding: 5px;
                border-radius: 5px;
                width: 80%;
                max-width: 500px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .image-panel-header {
                background-color: #f0f0f0;
                padding: 10px;
                border-bottom: 1px solid #dddddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .image-panel-header h3 {
                margin: 0;
                font-size: 18px;
            }
            .image-panel-close {
                cursor: pointer;
                font-size: 24px;
                color: #333333;
                font-weight: bold;
            }
            .image-panel-body {
                padding: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    updateProperties() {
        if (!this.state.getEditMode()) {
            return;
        }
        const selectedComponents = this.state.getSelectedComponents();
        selectedComponents.forEach(component => {
            if (component && !component.locked && this.state.getEditMode()) {
                this.addResizeHandles(component);
            }
        });
        const noSelection = this.properties.querySelector('#no-selection');
        const propertiesForm = this.properties.querySelector('#properties-form');

        if (selectedComponents.length === 0) {
            noSelection.style.display = 'block';
            propertiesForm.style.display = 'none';
            return;
        }
        noSelection.style.display = 'none';
        propertiesForm.style.display = 'block';

        const component = selectedComponents[0];
        propertiesForm.innerHTML = '';
        const group = document.createElement('div');
        group.className = 'property-group';
        group.innerHTML = `
            <div class="property-group-header">Size + Position</div>
            <div class="property-group-content">
                <div class="property-row">
                    <label class="property-label" for="left">Left:</label>
                    <input class="property-input" type="number" id="left" value="${component.left}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="top">Top:</label>
                    <input class="property-input" type="number" id="top" value="${component.top}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="width">Width:</label>
                    <input class="property-input" type="number" id="width" value="${component.width}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="height">Height:</label>
                    <input class="property-input" type="number" id="height" value="${component.height}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="z-index">Z-Index:</label>
                    <input class="property-input" type="number" id="z-index" value="${component.zIndex}">
                </div>
            </div>
        `;
        propertiesForm.appendChild(group);

        const stylesGroup = document.createElement('div');
        stylesGroup.className = 'property-group';
        stylesGroup.innerHTML = `
            <div class="property-group-header">Styles</div>
            <div class="property-group-content">
                <div class="property-row">
                    <label class="property-label" for="background-color">Background Color:</label>
                    <input class="property-input" type="color" id="background-color" value="${component.backgroundColor}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="border-color">Border Color:</label>
                    <input class="property-input" type="color" id="border-color" value="${component.borderColor}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="border-radius">Border Radius:</label>
                    <input class="property-input" type="number" id="border-radius" value="${component.borderRadius}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="border-width">Border Width:</label>
                    <input class="property-input" type="number" id="border-width" value="${component.borderWidth}">
                </div>
                <div class="property-row">
                    <label class="property-label" for="opacity">Opacity:</label>
                    <input class="property-input" type="range" id="opacity" value="${component.opacity}" step="0.1" min="0" max="1">
                    <span id="opacity-value">${component.opacity}</span>    
                </div>
                    <div class="property-row">
                        <label class="property-label" for="text-align">Text Align:</label>
                        <select class="property-input" id="text-align">
                            <option value="left" ${component.textAlign === 'left' ? 'selected' : ''}>Left</option>
                            <option value="center" ${component.textAlign === 'center' ? 'selected' : ''}>Center</option>
                            <option value="right" ${component.textAlign === 'right' ? 'selected' : ''}>Right</option>
                        </select>
                    </div>
                    <div class="property-row">
                        <label class="property-label" for="vertical-align">Vertical Align:</label>
                        <select class="property-input" id="vertical-align">
                            <option value="top" ${component.verticalAlign === 'top' ? 'selected' : ''}>Top</option>
                            <option value="middle" ${component.verticalAlign === 'middle' ? 'selected' : ''}>Middle</option>
                            <option value="bottom" ${component.verticalAlign === 'bottom' ? 'selected' : ''}>Bottom</option>
                        </select>
                    </div>
            </div>
        `;

        propertiesForm.appendChild(stylesGroup);

        switch (component.type) {
            case 'card':
                const cardGroup = document.createElement('div');
                cardGroup.className = 'property-group';
                cardGroup.innerHTML = `
                    <div class="property-group-header">Card Properties</div>
                    <div class="property-group-content">
                        <div class="property-row">
                            <label class="property-label" for="card-title">Title:</label>
                            <input class="property-input" type="text" id="card-title" value="${component.title}">
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="card-content">Content:</label>
                            <textarea class="property-input" id="card-content">${component.content}</textarea>
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="header-bg-color">Header Background Color:</label>
                            <input class="property-input" type="color" id="header-bg-color" value="${component.headerBGColor}">
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="header-text-color">Header Text Color:</label>
                            <input class="property-input" type="color" id="header-text-color" value="${component.headerTextColor}">
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="content-color">Content Color:</label>
                            <input class="property-input" type="color" id="content-color" value="${component.contentColor}">
                        </div>
                        <div class="property-row">
                            <label class="property-label">
                                <input type="checkbox" id="show-header" ${component.showHeader ? 'checked' : ''}>
                                Show Header
                            </label>
                        </div>
                    </div>
                `;
                propertiesForm.appendChild(cardGroup);
                break;
            case 'image':
                const imageGroup = document.createElement('div');
                imageGroup.className = 'property-group';
                imageGroup.innerHTML = `
                    <div class="property-group-header">Image Properties</div>
                    <div class="property-group-content">
                        <div class="property-row">
                            <label class="property-label" for="image-src">Image URL:</label>
                            <input class="property-input" type="url" id="image-src" value="${component.src}">
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="image-alt">Alt Text:</label>
                            <input class="property-input" type="text" id="image-alt" value="${component.alt}">
                        </div>
                        <div class="property-row">
                            <label class="property-label" for="object-fit">Object Fit:</label>
                            <select class="property-input" id="object-fit">
                                <option value="contain" ${component.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
                                <option value="cover" ${component.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
                                <option value="fill" ${component.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
                                <option value="none" ${component.objectFit === 'none' ? 'selected' : ''}>None</option>
                            </select>
                        </div>
                    </div>
                `;
                propertiesForm.appendChild(imageGroup);
                break;
        }
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'property-group';
        actionsGroup.innerHTML = `
            <div class="property-group-header">Actions</div>
            <div class="property-group-content">
                <div class="property-row">
                    <button id="delete-component" class="editor-button danger">Delete Component</button>
                </div>
            </div>
        `;

        propertiesForm.appendChild(actionsGroup);
        this.addPropertiesListeners(component);
    }
    addPropertiesListeners(component) {
        document.getElementById('left').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { left: parseInt(e.target.value, 10) });
        });

        document.getElementById('top').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { top: parseInt(e.target.value, 10) });
        });

        document.getElementById('width').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { width: parseInt(e.target.value, 10) });
        });

        document.getElementById('height').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { height: parseInt(e.target.value, 10) });
        });

        document.getElementById('z-index').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { zIndex: parseInt(e.target.value, 10) });
        });

        document.getElementById('background-color').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { backgroundColor: e.target.value });
        });

        document.getElementById('border-color').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { borderColor: e.target.value });
        });

        document.getElementById('border-radius').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { borderRadius: parseInt(e.target.value, 10) });
        });

        document.getElementById('border-width').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { borderWidth: parseInt(e.target.value, 10) });
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('opacity-value').textContent = value;
            this.state.updateComponent(component.id, { opacity: value });
        });

        document.getElementById('text-align').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { textAlign: e.target.value });
        });
        
        document.getElementById('vertical-align').addEventListener('change', (e) => {
            this.state.updateComponent(component.id, { verticalAlign: e.target.value });
        });

        switch (component.type) {
            case 'card':
                document.getElementById('card-title').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { title: e.target.value });
                });

                document.getElementById('card-content').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { content: e.target.value });
                });

                document.getElementById('header-bg-color').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { headerBGColor: e.target.value });
                });

                document.getElementById('header-text-color').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { headerTextColor: e.target.value });
                });

                document.getElementById('content-color').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { contentColor: e.target.value });
                });
                document.getElementById('show-header').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { showHeader: e.target.checked });
                });
                break;
            case 'image':
                document.getElementById('image-src').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { src: e.target.value });
                });

                document.getElementById('image-alt').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { alt: e.target.value });
                });

                document.getElementById('object-fit').addEventListener('change', (e) => {
                    this.state.updateComponent(component.id, { objectFit: e.target.value });
                });
                break;
        }

        document.getElementById('delete-component').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this component?')) {
                this.state.removeComponent(component.id);
            }
        });
    }
    initDragAndDrop() {
        const components = this.components.querySelectorAll('.component');
        components.forEach(item => {
            item.addEventListener('mousedown', (e) => {
                if (!this.state.getEditMode()) {
                    return;
                }
                const type = item.getAttribute('data-type');
                const temp = document.createElement('div');
                temp.className = 'temp-component';
                temp.textContent - item.querySelector('h4').textContent;
                temp.style.position = 'absolute';
                temp.style.zIndex = '1000';
                temp.style.backgroundColor = '#ffffff';
                temp.style.border = '1px solid #dddddd';
                temp.style.borderRadius = '5px';
                temp.style.padding = '10px';
                temp.style.opacity = '0.8';
                temp.style.pointerEvents = 'none';
                temp.style.left = e.pageX + 'px';
                temp.style.top = e.pageY + 'px';
                document.body.appendChild(temp);
                const moveHandler = event => {
                    temp.style.left = event.pageX + 'px';
                    temp.style.top = event.pageY + 'px';
                };

                const dropHandler = event => {
                    document.body.removeChild(temp);
                    document.removeEventListener('mousemove', moveHandler);
                    document.removeEventListener('mouseup', dropHandler);
                    const canvasRect = this.canvas.getBoundingClientRect();
                    if (event.clientX >= canvasRect.left && event.clientX <= canvasRect.right && event.clientY >= canvasRect.top && event.clientY <= canvasRect.bottom) {
                        const x = event.clientX - canvasRect.left + this.canvas.scrollLeft;
                        const y = event.clientY - canvasRect.top + this.canvas.scrollTop;
                        this.addComponent(type, { left: x, top: y });
                    }
                };
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', dropHandler);
            });
        });
    }
    rerender() {
        this.canvas.innerHTML = '';
        Object.values(this.state.components).forEach(component => {
            component.render(this.canvas);

            if (component.selected && this.state.getEditMode()) {
                component.reference.classList.add('selected');
            }

            if (!this.state.getEditMode()) {
                component.reference.style.pointerEvents = 'none';
            }
        });
    }
    updateButtons() {
        const undoButton = this.toolbar.querySelector('#undo');
        const redoButton = this.toolbar.querySelector('#redo');
        undoButton.disabled = this.state.idxLog <= 0;
        redoButton.disabled = this.state.idxLog >= this.state.log.length - 1;
    }
    save() {
        const state = this.state.makeJSON();
        localStorage.setItem('editorState', JSON.stringify(state));
    }
    load() {
        const state = localStorage.getItem('editorState');
        if (!state) {
            return;
        }

        try {
            const parsedState = JSON.parse(state);
            this.state.loadJSON(parsedState);
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
}