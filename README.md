Tetris
======

Multiplayer Javascript Tetris (node.js, easeljs, angular.js, socket.io, foundation.css) 

* Classical Tetris type of game
* Multiplayer feature
* Live updates/broadcast of all players playing
* Highscores


Development/Setup
-----
Dependencies for the Server (npm)
```
    cd server
    npm install
```
Dependencies for the client (hard copied within the repository)
```
    src/js/libs
```

To start the Server:
```
    cd server
    node index.js
```
It starts the express web and the socket server. The express server only delivers the static files from /src to the http route /app.

Point Browser to: `http://localhost:2550/app` (alter the hostname to match your node server), enter a name and play or watch others currently playing - live.


