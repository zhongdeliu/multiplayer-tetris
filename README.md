Tetris
======

Multiplayer Javascript Tetris (node.js, easeljs, angular.js, socket.io, foundation.css) 

* Classical Tetris type of game
* Multiplayer feature
* Live updates/broadcast of all players playing
* Highscores

Demo here: http://multi-tetris.herokuapp.com/

Development/Setup
-----
Dependencies for the Server (npm)
```
    npm install
```
Dependencies for the client (hard copied within the repository)
```
    src/js/libs
```
But you can use bower to fetch a copy of them: `bower install`

To start the Server:
```
    node index.js
```
It starts the express web and the socket server. The express server only delivers the static files from /src to the http route /app.

Point Browser to: `http://localhost:2550` (alter the hostname/port to match your node server), enter a name and play or watch others currently playing - live.


Play here: http://multi-tetris.herokuapp.com/
