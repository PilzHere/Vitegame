import Game from './core/Game.js';

// Set page title from package.json
document.title = __APP_NAME__;

const game = new Game();
game.start();