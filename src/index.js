const SCREEN = new ROT.Display({ spacing: 1.1 });
const gamesBaseURL = 'http://localhost:3000/games';

const KeyEnum = {
  ENTER: 13,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  S: 83,
  W: 87,
};

function setup() {
  document.body.appendChild(SCREEN.getContainer());
  MainMenu.init();
}

const MainMenu = {
  // display: null,
  x: null,
  y: null,
  cursor: '>',
  cursorY: 0,

  init() {
    // this.display = new ROT.Display({spacing: 1.1});

    this.x = Math.floor(SCREEN._options.width / 2) - 7;
    this.y = Math.floor(SCREEN._options.height / 2) - 2;

    window.addEventListener('keydown', MainMenu.handleEvent);
    // document.body.appendChild(SCREEN.getContainer());
    MainMenu.draw();
  },

  move(direction) {
    if (direction === 'up') {
      this.cursorY = ROT.Util.mod(this.cursorY - 1, 3);
    } else if (direction === 'down') {
      this.cursorY = ROT.Util.mod(this.cursorY + 1, 3);
    }

    MainMenu.draw();
  },

  handleEvent(e) {
    // Handles moving the cursor
    switch (e.keyCode) {
      case KeyEnum.UP:
      case KeyEnum.W:
        MainMenu.move('up');
        break;

      case KeyEnum.DOWN:
      case KeyEnum.S:
        MainMenu.move('down');
        break;

      case KeyEnum.ENTER:
        MainMenu.select();
      default:
        break;
    }
  },

  select() {
    switch (this.cursorY) {
      case 0:
        console.log('starting a new game');
        MainMenu.destage();
        Game.init();
        break;
      case 1:
        console.log('show load game menu');
        break;
      case 2:
        console.log('show high scores');
        MainMenu.destage();
        HighScores.init();
        break;
    }
  },

  destage() {
    window.removeEventListener('keydown', this.handleEvent);
    // document.body.removeChild(this.display.getContainer());
  },

  draw() {
    SCREEN.clear();
    SCREEN.drawText(MainMenu.x, MainMenu.y, 'New Game');
    SCREEN.drawText(MainMenu.x, MainMenu.y + 1, 'Load Game');
    SCREEN.drawText(MainMenu.x, MainMenu.y + 2, 'High Scores');
    SCREEN.drawText(
      MainMenu.x - 1,
      MainMenu.y + MainMenu.cursorY,
      MainMenu.cursor
    );
  },
};

const HighScores = {
  // display: null,
  x: null,
  y: null,
  scores: [],

  init() {
    this.x = 5;
    this.y = 5;
    // this.display = new ROT.Display({ spacing: 1.1 });
    // document.body.appendChild(this.display.getContainer());
    this.fetchScores();
  },

  fetchScores() {
    fetch(gamesBaseURL)
      .then(res => res.json())
      .then(games => {
        games = games.sort((a, b) => (a.score < b.score ? 1 : -1));
        console.log(games);
        this.scores = games;
        this.draw();
      });
  },

  draw() {
    SCREEN.clear();
    for (let i = 0; i < this.scores.length; i += 1) {
      SCREEN.drawText(
        this.x,
        this.y + i,
        `${this.scores[i].user}  -  ${this.scores[i].score}`
      );
    }
  },

  stage() {},
};

let SCORE = 0;
const USER = 'Ben';

function postScore(user, score) {
  fetch(gamesBaseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      user,
      score,
    }),
  });
}

const Game = {
  // display: null, 
  map: {},
  engine: null,
  player: null,
  pedro: null,
  ananas: null,

  init() {
    // this.display = new ROT.Display({ spacing: 1.1 });
    // document.body.appendChild(this.display.getContainer());

    this.map = {};
    SCREEN.clear();
    this._generateMap();

    const scheduler = new ROT.Scheduler.Simple();
    scheduler.add(this.player, true);
    scheduler.add(this.pedro, true);

    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  },

  _generateMap() {
    const digger = new ROT.Map.Digger();
    const freeCells = [];

    const digCallback = function(x, y, value) {
      if (value) {
        return;
      }

      const key = `${x},${y}`;
      this.map[key] = '.';
      freeCells.push(key);
    };
    digger.create(digCallback.bind(this));

    this._generateBoxes(freeCells);
    this._drawWholeMap();

    this.player = this._createBeing(Player, freeCells);
    this.pedro = this._createBeing(Pedro, freeCells);
  },

  _createBeing(what, freeCells) {
    const index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    const key = freeCells.splice(index, 1)[0];
    const parts = key.split(',');
    const x = parseInt(parts[0]);
    const y = parseInt(parts[1]);
    return new what(x, y);
  },

  _generateBoxes(freeCells) {
    for (let i = 0; i < 10; i += 1) {
      const index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      const key = freeCells.splice(index, 1)[0];
      this.map[key] = '*';
      if (!i) {
        this.ananas = key;
      } /* first box contains an ananas */
    }
  },

  _drawWholeMap() {
    Object.keys(this.map).forEach(key => {
      const parts = key.split(',');
      const x = parseInt(parts[0]);
      const y = parseInt(parts[1]);
      SCREEN.draw(x, y, this.map[key]);
    });
  },
};

const Player = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
};

Player.prototype.getSpeed = function() {
  return 100;
};
Player.prototype.getX = function() {
  return this._x;
};
Player.prototype.getY = function() {
  return this._y;
};

Player.prototype.act = function() {
  Game.engine.lock();
  window.addEventListener('keydown', this);
};

Player.prototype.handleEvent = function(e) {
  const code = e.keyCode;
  if (code === 13 || code === 32) {
    this._checkBox();
    return;
  }

  const keyMap = {};
  keyMap[38] = 0;
  keyMap[33] = 1;
  keyMap[39] = 2;
  keyMap[34] = 3;
  keyMap[40] = 4;
  keyMap[35] = 5;
  keyMap[37] = 6;
  keyMap[36] = 7;

  /* one of numpad directions? */
  if (!(code in keyMap)) {
    return;
  }

  /* is there a free space? */
  const dir = ROT.DIRS[8][keyMap[code]];
  const newX = this._x + dir[0];
  const newY = this._y + dir[1];
  const newKey = `${newX},${newY}`;
  if (!(newKey in Game.map)) {
    return;
  }

  SCREEN.draw(this._x, this._y, Game.map[`${this._x},${this._y}`]);
  this._x = newX;
  this._y = newY;
  this._draw();
  window.removeEventListener('keydown', this);
  Game.engine.unlock();
};

Player.prototype._draw = function() {
  SCREEN.draw(this._x, this._y, '@', '#ff0');
};

Player.prototype._checkBox = function() {
  const key = `${this._x},${this._y}`;
  if (Game.map[key] !== '*') {
    alert('There is no box here!');
  } else if (key === Game.ananas) {
    // TODO: Load new level and increment score
    alert(`Hooray! You found an ananas and won this game. ${SCORE}`);
    SCORE += 1;
    Game.engine.lock();
    Game.init();
  } else {
    alert('This box is empty :-(');
  }
};

const Pedro = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
};

Pedro.prototype.getSpeed = function() {
  return 100;
};

Pedro.prototype.act = function() {
  let x = Game.player.getX();
  let y = Game.player.getY();

  const passableCallback = function(x, y) {
    return `${x},${y}` in Game.map;
  };
  const astar = new ROT.Path.AStar(x, y, passableCallback, { topology: 4 });

  const path = [];
  const pathCallback = function(x, y) {
    path.push([x, y]);
  };
  astar.compute(this._x, this._y, pathCallback);

  path.shift();
  if (path.length <= 1) {
    // TODO: Stop game. Send score post request. Send player to high scores.
    alert('Game over - you were captured by Pedro!');
    postScore(USER, SCORE);
    Game.engine.lock();
    Game.init();
  } else {
    x = path[0][0];
    y = path[0][1];
    SCREEN.draw(this._x, this._y, Game.map[`${this._x},${this._y}`]);
    this._x = x;
    this._y = y;
    this._draw();
  }
};

Pedro.prototype._draw = function() {
  SCREEN.draw(this._x, this._y, 'P', 'red');
};

// Game.init();
