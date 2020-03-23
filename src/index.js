function renderStartScreen() {
  const display = StartScreen.init();
  StartScreen.draw();

  
  window.addEventListener('keydown', MenuCursor.handleEvent);

  document.body.appendChild(display.getContainer());
}

const StartScreen = {
  display: null,

  init() {
    this.display = new ROT.Display({spacing: 1.1})
    return this.display;
  },

  draw() {
    this.display.clear();
    this.display.drawText(5,5, "New Game");
    this.display.drawText(5,6, "High Scores");
    this.display.drawText(5,7, "Load Game");
    this.display.drawText(MenuCursor.x, MenuCursor.y, MenuCursor.symbol);
  }

}


const MenuCursor = {
  symbol: '>',
  x: 4,
  y: 5,
  move: function(direction){
    if(direction == 'up') {
      this.y = ROT.Util.mod((this.y-1-5), 3) + 5;
    } else if( direction == 'down') {
      
      this.y = ROT.Util.mod((this.y+1-5), 3) + 5;
    }
    StartScreen.draw();
  },

  select: function() {
    switch (this.y) {
      case 5:
        console.log('starting a new game');
        window.removeEventListener('keydown', MenuCursor.handleEvent);
        document.body.removeChild(StartScreen.display.getContainer());
        Game.init();
        break;
      case 6:
        console.log('show high scores');
        break;
      case 7:
        console.log('show load game menu');
        break;
    }
  },

  handleEvent : function(e) {
    switch (e.keyCode) {
      // up arrow
      case 38:
        MenuCursor.move('up');
        break;
        // down arrow
      case 40:
        MenuCursor.move('down');
        break;
      case 13:
        MenuCursor.select();
      default:
        break;
    }
  }
}

const Game = {
  display: null,
  map: {},
  engine: null,
  player: null,
  pedro: null,
  ananas: null,

  init() {
    this.display = new ROT.Display({ spacing: 1.1 });
    document.body.appendChild(this.display.getContainer());

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
    for (let i = 0; i < 10; i++) {
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
      this.display.draw(x, y, this.map[key]);
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

  Game.display.draw(this._x, this._y, Game.map[`${this._x},${this._y}`]);
  this._x = newX;
  this._y = newY;
  this._draw();
  window.removeEventListener('keydown', this);
  Game.engine.unlock();
};

Player.prototype._draw = function() {
  Game.display.draw(this._x, this._y, '@', '#ff0');
};

Player.prototype._checkBox = function() {
  const key = `${this._x},${this._y}`;
  if (Game.map[key] !== '*') {
    alert('There is no box here!');
  } else if (key === Game.ananas) {
    alert('Hooray! You found an ananas and won this game.');
    Game.engine.lock();
    window.removeEventListener('keydown', this);
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
  if (path.length === 1) {
    Game.engine.lock();
    alert('Game over - you were captured by Pedro!');
  } else {
    x = path[0][0];
    y = path[0][1];
    Game.display.draw(this._x, this._y, Game.map[`${this._x},${this._y}`]);
    this._x = x;
    this._y = y;
    this._draw();
  }
};

Pedro.prototype._draw = function() {
  Game.display.draw(this._x, this._y, 'P', 'red');
};

// Game.init();
