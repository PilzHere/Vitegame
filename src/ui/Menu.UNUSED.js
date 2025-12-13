export default class Menu {
    constructor(uiManager, id = 'menu') {
        this.uiManager = uiManager;
        this.id = id;
        this.buttons = new Map();
        this.isVisible = false;
        this.#create();
    }

    #create() {
        this.container = this.uiManager.createElement(this.id, {
            styles: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '40px',
                borderRadius: '10px',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
                color: 'white',
                display: 'none',
                minWidth: '300px'
            },
            interactive: true
        });
    }

    setTitle(text) {
        let title = this.container.querySelector('h1');
        if (!title) {
            title = document.createElement('h1');
            title.style.marginTop = '0';
            this.container.prepend(title);
        }
        title.textContent = text;
    }

    addButton(id, text, callback) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.style.cssText = `
            display: block;
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            font-size: 16px;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            transition: background-color 0.3s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#45a049';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#4CAF50';
        });

        button.addEventListener('click', () => {
            if (callback) callback();
        });

        this.container.appendChild(button);
        this.buttons.set(id, button);

        return button;
    }

    removeButton(id) {
        const button = this.buttons.get(id);
        if (button) {
            button.remove();
            this.buttons.delete(id);
        }
    }

    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        this.uiManager.removeElement(this.id);
        this.buttons.clear();
    }
}
