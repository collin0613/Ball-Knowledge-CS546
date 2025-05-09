class CustomComponent {
    constructor(config = {}) {
        this.id = config.id || 'custom-component-' + Math.random().toString(36).substr(2, 9);
        this.type = config.type || 'default';
        this.left = config.left || 0;
        this.top = config.top || 0;
        this.width = config.width || 300;
        this.height = config.height || 200;
        this.zIndex = config.zIndex || 1;
        this.backgroundColor = config.backgroundColor || '#ffffff';
        this.borderColor = config.borderColor || '#000000';
        this.borderRadius = config.borderRadius || 0;
        this.borderWidth = config.borderWidth || 1;
        this.boxShadow = config.boxShadow || '0 2px 4px rgba(0,0,0,0.1)';
        this.opacity = config.opacity || 1;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.locked = config.locked || false;
        this.selected = false;
        this.reference = null;
    }
    render(parent) {
        if (this.reference && this.reference.parentNode === parent) {
            this.reference.style.left = `${this.left}px`;
            this.reference.style.top = `${this.top}px`;
            this.reference.style.width = `${this.width}px`;
            this.reference.style.height = `${this.height}px`;
            this.reference.style.zIndex = this.zIndex;
            this.reference.style.backgroundColor = this.backgroundColor;
            this.reference.style.borderColor = this.borderColor;
            this.reference.style.borderRadius = `${this.borderRadius}px`;
            this.reference.style.borderWidth = `${this.borderWidth}px`;
            this.reference.style.borderStyle = 'solid';
            this.reference.style.boxShadow = this.boxShadow;
            this.reference.style.opacity = this.opacity;
            if (!this.visible) {
                this.reference.style.display = 'none';
            } else {
                this.reference.style.display = 'block';
            }
            return this.reference;
        }
        
        if (this.reference && this.reference.parentNode) {
            this.reference.parentNode.removeChild(this.reference);
        }
        
        const ref = document.createElement('div');
        ref.className = `editor-component ${this.type}`;
        ref.setAttribute('component-id', this.id);
        ref.setAttribute('component-type', this.type);
        ref.style.position = 'absolute';
        ref.style.left = `${this.left}px`;
        ref.style.top = `${this.top}px`;
        ref.style.width = `${this.width}px`;
        ref.style.height = `${this.height}px`;
        ref.style.zIndex = this.zIndex;
        ref.style.backgroundColor = this.backgroundColor;
        ref.style.borderColor = this.borderColor;
        ref.style.borderRadius = `${this.borderRadius}px`;
        ref.style.borderWidth = `${this.borderWidth}px`;
        ref.style.borderStyle = 'solid';
        ref.style.boxShadow = this.boxShadow;
        ref.style.opacity = this.opacity;
        if (!this.visible) {
            ref.style.display = 'none';
        }
        this.reference = ref;
        parent.appendChild(ref);
        return ref;
    }

    configure(config) {
        const oldRef = this.reference;
        const parent = oldRef ? oldRef.parentNode : null;
        
        Object.assign(this, config);
    
        if(oldRef && parent) {
            console.log(`Updating component ${this.id} with:`, config);
            
            if (config.left !== undefined) oldRef.style.left = `${this.left}px`;
            if (config.top !== undefined) oldRef.style.top = `${this.top}px`;
            if (config.width !== undefined) oldRef.style.width = `${this.width}px`;
            if (config.height !== undefined) oldRef.style.height = `${this.height}px`;
            if (config.zIndex !== undefined) oldRef.style.zIndex = this.zIndex;
            if (config.backgroundColor !== undefined) oldRef.style.backgroundColor = this.backgroundColor;
            if (config.borderColor !== undefined) oldRef.style.borderColor = this.borderColor;
            if (config.borderRadius !== undefined) oldRef.style.borderRadius = `${this.borderRadius}px`;
            if (config.borderWidth !== undefined) oldRef.style.borderWidth = `${this.borderWidth}px`;
            if (config.boxShadow !== undefined) oldRef.style.boxShadow = this.boxShadow;
            if (config.opacity !== undefined) oldRef.style.opacity = this.opacity;
            
            if (config.visible !== undefined) {
                oldRef.style.display = this.visible ? 'block' : 'none';
            }
        } else {
            console.warn(`Cannot update component ${this.id}: No DOM reference`);
        }
    }

    hide() {
        if(this.reference && this.reference.parentNode) {
            this.reference.parentNode.removeChild(this.reference);
            this.reference = null;
        }
    }
    makeJSON() {
        return {
            id: this.id,
            type: this.type,
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height,
            zIndex: this.zIndex,
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
            borderRadius: this.borderRadius,
            borderWidth: this.borderWidth,
            boxShadow: this.boxShadow,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked
        };
    }
    static makeComponent(json) {
        return new CustomComponent(json);
    }
}

class Card extends CustomComponent {
    constructor(config = {}) {
        config.type = 'card';
        super(config);

        this.title = config.title || 'Custom Card';
        this.content = config.content || 'This is a custom card';
        this.headerBGColor = config.headerBGColor || '#f0f0f0';
        this.headerTextColor = config.headerTextColor || '#000000';
        this.contentColor = config.contentColor || '#000000';
    }
    render(parent) {
        const ref = super.render(parent);
        ref.innerHTML = `
            <div class="card-header" style="background-color: ${this.headerBGColor}; color: ${this.headerTextColor}; border-bottom: 1px solid ${this.borderColor}; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                <h2 class="card-title">${this.title}</h2>
                <div class="card-controls"></div>
            </div>
            <div class="card-content" style="color: ${this.contentColor};">
                <p>${this.content}</p>
            </div>
        `;
    }
    configure(config) {
        super.configure(config);
        if (this.reference) {
            const title = this.reference.querySelector('.card-title');
            const header = this.reference.querySelector('.card-header');
            const content = this.reference.querySelector('.card-content p');
            if(title) {
                title.textContent = this.title;
                title.style.color = this.headerTextColor;
            }
            if(header) {
                header.style.backgroundColor = this.headerBGColor;
            }
            if(content) {
                content.textContent = this.content;
                content.style.color = this.contentColor;
            }
        }
    }
    makeJSON() {
        const json = super.makeJSON();
        json.title = this.title;
        json.content = this.content;
        json.headerBGColor = this.headerBGColor;
        json.headerTextColor = this.headerTextColor;
        json.contentColor = this.contentColor;
        return json;
    }
    static makeComponent(json) {
        return new Card(json);
    }
}

class Image extends CustomComponent {
    constructor(config = {}) {
        config.type = 'image';
        super(config);
        this.src = config.src || '';
        this.alt = config.alt || 'Image';
        this.objectFit = config.objectFit || 'contain';
    }
    render(parent) {
        const ref = super.render(parent);
        ref.innerHTML = `
            <img src="${this.src}" alt="${this.alt}" style="width: 100%; height: 100%; object-fit: ${this.objectFit};">
        `;
        return ref;
    }
    configure(config) {
        super.configure(config);
        if (this.reference) {
            const img = this.reference.querySelector('img');
            if (img) {
                img.src = this.src;
                img.alt = this.alt;
                img.style.objectFit = this.objectFit;
            }
        }
    }
    makeJSON() {
        const json = super.makeJSON();
        json.src = this.src;
        json.alt = this.alt;
        json.objectFit = this.objectFit;
        return json;
    }
    static makeComponent(json) {
        return new Image(json);
    }
}