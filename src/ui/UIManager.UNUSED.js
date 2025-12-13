export default class UIManager {
    constructor() {
        this.elements = new Map();
        this.container = null;
        this.#createContainer();
    }

    #createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'ui-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.container);
    }

    createElement(id, options = {}) {
        const element = document.createElement(options.tag || 'div');
        element.id = id;

        if (options.className) {
            element.className = options.className;
        }

        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }

        if (options.styles) {
            Object.assign(element.style, options.styles);
        }

        element.style.pointerEvents = options.interactive ? 'auto' : 'none';

        this.container.appendChild(element);
        this.elements.set(id, element);

        return element;
    }

    getElement(id) {
        return this.elements.get(id);
    }

    updateElement(id, content) {
        const element = this.elements.get(id);
        if (element) {
            element.innerHTML = content;
        }
    }

    showElement(id) {
        const element = this.elements.get(id);
        if (element) {
            element.style.display = 'block';
        }
    }

    hideElement(id) {
        const element = this.elements.get(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    removeElement(id) {
        const element = this.elements.get(id);
        if (element) {
            element.remove();
            this.elements.delete(id);
        }
    }

    clear() {
        this.elements.forEach(element => element.remove());
        this.elements.clear();
    }

    setVisibility(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }
}
