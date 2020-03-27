const SCREEN = new ROT.Display({ spacing: 1.1 });
const gamesBaseURL = 'http://localhost:3000/games';
const userBaseURL = 'http://localhost:3000/users';

const KeyEnum = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  S: 83,
  W: 87,
};

const DirectionEnum = {
  LEFT: 'left',
  UP: 'up',
  DOWN: 'down',
  RIGHT: 'right',
};

class Drawable {
  constructor(x = 0, y = 0, what) {
    this.x = x;
    this.y = y;
    this.what = what;
  }
}

class View {
  display;

  drawables;

  _eventListeners;

  constructor(display, drawables = []) {
    // console.log(display, drawables)
    this.display = display;
    this.drawables = drawables;
    this._eventListeners = [];

    // binding this because JavaScript's OO behaves oddly
    this.drawDrawable = this.drawDrawable.bind(this);
  }

  clear() {
    this.display.clear();
  }

  draw() {
    // console.log(this)
    this.display.clear();
    this.drawables.forEach(this.drawDrawable);
  }

  drawDrawable(drawable) {
    // console.log("drawDrawable: ",this)
    if (typeof drawable.what === 'string') {
      this.display.drawText(drawable.x, drawable.y, drawable.what);
    } else {
      this.display.draw(drawable.x, drawable.y, drawable.what);
    }
  }

  addEventListener(target, callback) {
    // console.log("View.addEventListener: ",this)
    this._eventListeners.push({ target, callback });
    // window.addEventListener(target, callback);
  }

  removeEventListener(target, callback) {
    // console.log("View.removeEventListener: ", this)
    for (let i = 0; i < this._eventListeners.length; i += 1) {
      const listener = this._eventListeners[i];

      if (listener.target === target && listener.callback === callback) {
        window.removeEventListener(target, callback);
        this._eventListeners.splice(i, 1);
      }
    }
  }

  stage() {
    // console.log("View.stage: ", this)
    this._eventListeners.forEach(listener => {
      // console.log("innerStage: ", this)
      window.addEventListener(listener.target, listener.callback);
    });

    this.draw();
  }

  destage() {
    // console.log("View.destage: ", this)
    this._eventListeners.forEach(listener => {
      window.removeEventListener(listener.target, listener.callback);
    });
  }

  switchViews(newView) {
    this.destage();
    newView.stage();
  }
}

function createUser(user) {
  fetch(userBaseURL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: user,
    }),
  });
  // .then(resp => resp.json())
  // .then(json => console.log(json))
}

function setup() {
  MainMenu.init();
  HighScores.init();

  login();
}

const login = function() {
  const loginForm = document.createElement('form');
  const usernameInput = document.createElement('input');
  const submitBtn = document.createElement('button');
  const flavorText = document.getElementById('flavor-text');
  const legend = document.getElementById('legend');

  usernameInput.placeholder = 'Enter Name';
  submitBtn.innerText = 'Start Game';

  loginForm.appendChild(usernameInput);
  loginForm.appendChild(submitBtn);
  document.body.appendChild(loginForm);

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    USER = usernameInput.value;
    SCORE = 0;
    createUser(USER);
    flavorText.style.display = 'none';
    legend.style.display = 'inline';
    document.body.removeChild(loginForm);
    document.body.appendChild(SCREEN.getContainer());
    MainMenu.view.stage();
  });
};

const MainMenu = {
  menuItems: [],
  selItem: 0,
  cursor: null,
  view: null,

  init() {
    this.menuItems.push(
      new Drawable(
        Math.floor(SCREEN._options.width / 2) - 7,
        Math.floor(SCREEN._options.height / 2) - 2,
        'NEW GAME'
      )
    );

    this.menuItems.push(
      new Drawable(this.menuItems[0].x, this.menuItems[0].y + 1, 'HIGH SCORES')
    );

    this.menuItems.push(
      new Drawable(this.menuItems[0].x, this.menuItems[0].y + 2, 'LOG OUT')
    );

    this.selItem = 0;
    this.cursor = new Drawable(
      this.menuItems[0].x - 1,
      this.menuItems[0].y,
      '>'
    );
    this.view = new View(SCREEN, [...this.menuItems, this.cursor]);

    // So 'this' is in the correct context
    this.handleEvent = this.handleEvent.bind(this);

    this.view.addEventListener('keydown', this.handleEvent);
  },

  handleEvent(e) {
    // console.log("MainMenu.handleEvent ",this)
    // Handles moving the cursor
    switch (e.keyCode) {
      case KeyEnum.UP:
      case KeyEnum.W:
        // debugger;
        this.selItem = ROT.Util.mod(this.selItem - 1, this.menuItems.length);
        this.cursor.y = this.menuItems[this.selItem].y;
        this.view.draw();
        break;

      case KeyEnum.DOWN:
      case KeyEnum.S:
        this.selItem = ROT.Util.mod(this.selItem + 1, this.menuItems.length);
        this.cursor.y = this.menuItems[this.selItem].y;
        this.view.draw();
        break;

      case KeyEnum.ENTER:
      case KeyEnum.SPACE:
        this.select();
        break;
    }
  },

  select() {
    switch (this.selItem) {
      case 0:
        // console.log('starting a new game');
        this.view.destage();
        Game.init();
        break;

      case 1:
        // console.log('show high scores');
        this.view.switchViews(HighScores.view);
        // HighScores.draw();
        break;

      case 2:
        // console.log('logout');
        this.view.destage();
        document.body.removeChild(SCREEN.getContainer());
        login();
    }
  },
};

const HighScores = {
  view: null,
  scores: [],
  cols: [],
  menuItems: [],
  selItem: 0,
  cursor: null,

  init() {
    this.view = new View(SCREEN);

    // Make proper context for 'this'
    this.draw = this.draw.bind(this);
    this.handleEvent = this.handleEvent.bind(this);

    // Overwrite the draw function on the view for the more complex stuff.
    this.view.draw = this.draw;

    this.fetchScores();

    this.cols = [
      { x: 5, y: 3 },
      { x: 30, y: 3 },
      { x: 55, y: 3 },
    ];

    this.menuItems.push({
      x: Math.floor(SCREEN._options.width / 2) - 16,
      y: SCREEN._options.height - 1,
      what: 'MAIN MENU',
    });

    this.menuItems.push({ 
      x: Math.floor(SCREEN._options.width / 2) - 4,
      y: SCREEN._options.height - 1,
      what: 'NEW GAME',
    });

    this.menuItems.push({
      x: Math.floor(SCREEN._options.width / 2) + 7,
      y: SCREEN._options.height - 1, 
      what: 'LOG OUT'
    })

    this.cursor = new Drawable(
      this.menuItems[0].x - 1,
      this.menuItems[0].y,
      '>'
    );

    this.view.addEventListener('keydown', this.handleEvent);
  },

  addScore(user, score) {
    // console.log("HighScores.addScore: ", this);
    this.scores.push({ user, score });
    this.scores = this.scores.sort((a, b) => (a.score < b.score ? 1 : -1));
  },

  fetchScores() {
    // console.log("HighScores.fetchScores: ",this)
    fetch(gamesBaseURL)
      .then(res => res.json())
      .then(games => {
        // console.log("HighScores.fetchScores.then: ",this)
        this.view.drawables = [];
        games = games.sort((a, b) => (a.score < b.score ? 1 : -1));

        this.scores = games;
      });
  },

  draw() {
    // console.log("HighScores.draw: ", this)
    this.view.clear();

    const end = this.scores.length < 60 ? this.scores.length : 60;
    for (let col = 0; col < this.cols.length; col += 1) {
      for (let i = 0; i < 20 && col * 20 + i < end; i += 1) {
        this.view.drawDrawable({
          x: this.cols[col].x,
          y: this.cols[col].y + i,
          what: `${col * 20 + i + 1}: ${this.scores[col * 20 + i].user}  -  ${
            this.scores[col * 20 + i].score
          }`,
        });
      }
    }

    this.menuItems.forEach(item => {
      this.view.drawDrawable(item);
    })

    this.view.drawDrawable(this.cursor);

    // draw center top
    this.view.drawDrawable({
      x: Math.floor(SCREEN._options.width / 2) - 6,
      y: 1,
      what: 'HIGH SCORES',
    });

    // // draw center bottom
    // this.view.drawDrawable({
    //   x: Math.floor(SCREEN._options.width / 2) - 12,
    //   y: SCREEN._options.height - 1,
    //   what: 'Main Menu',
    // });
  },

  handleEvent(e) {
    // console.log("MainMenu.handleEvent ",this)
    // Handles moving the cursor
    switch (e.keyCode) {
      case KeyEnum.LEFT:
      case KeyEnum.A:
        // debugger;
        this.selItem = ROT.Util.mod(this.selItem - 1, this.menuItems.length);
        this.cursor.x = this.menuItems[this.selItem].x - 1;
        this.view.draw();
        break;

      case KeyEnum.RIGHT:
      case KeyEnum.D:
        this.selItem = ROT.Util.mod(this.selItem + 1, this.menuItems.length);
        this.cursor.x = this.menuItems[this.selItem].x - 1;
        this.view.draw();
        break;

      case KeyEnum.ENTER:
      case KeyEnum.SPACE:
        this.select();
        break;
    }
  },

  select() {
    switch (this.selItem) {
      case 0:
        this.view.switchViews(MainMenu.view);
        // this.selItem = 0;
        break;

      case 1:
        this.view.destage();
        Game.init();
        break;

      case 2:
        this.view.destage();
        document.body.removeChild(SCREEN.getContainer());
        login();
    }
  }
}

let SCORE = 0;
let USER = 'Ben';

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

function displayModal(text) {
  const modal = document.getElementById('myModal');
  modal.style.display = 'block';
  const span = document.getElementsByClassName('close')[0];
  const content = document.getElementById('popup-content');
  content.innerText = text;

  console.log('AAAAAAAAAAAHHHHHHHH');

  span.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

const Game = {
  // display: null,
  view: null,
  map: {},
  engine: null,
  player: null,
  pedro: null,
  ananas: null,

  init() {
    this.view = new View(SCREEN);

    this.map = {};
    this.view.clear();
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
  if (code === KeyEnum.ENTER || code === KeyEnum.SPACE) {
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
    displayModal('There is no TP here!');
  } else if (key === Game.ananas) {
    // TODO: Load new level and increment score
    SCORE += 1;
    displayModal(
      `You found the TP! Encouraged by this victory you decide to delve deeper!`
    );
    window.removeEventListener('keydown', this);
    Game.engine.lock();
    Game.init();
  } else {
    displayModal('This shelf is empty :-(');
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
    displayModal('Game over - you were captured by the Toilet Tyrant!');
    Game.engine.lock();
    postScore(USER, SCORE);
    HighScores.addScore(USER, SCORE);

    HighScores.view.stage();
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
  SCREEN.draw(this._x, this._y, 'T', 'red');
};

// Game.init();
