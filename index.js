var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use('/app', express.static('/src'));

var players = {};
var scores;

fs.readFile('scores.json', function(err, data) {
    if (data) {
        scores = JSON.parse(data.toString());
    } else {
        scores = [];
    }
});

io.on('connection', function(socket) {
    socket.on('player join', function(player) {
        if (players[player.name]) {
            //fn(true);
        } else {
            if (socket.name) {
                socket.name = player.name;
            } else {
                //fn(false);
                players[player.name] = player;
                socket.name = player.name;
                io.emit('player joined', player);
                io.emit('players', players);
            }
        }
    });
     socket.on('room join', function(gameName) {
        /*
        game.name = gameName;
        game.players[socket.name] = players[socket.name];
        socket.join(game.name, function() {
            io.sockets.in(game.name).emit('player joined room', game.players);
        });
        */
    });
    socket.on('game status', function(game) {
        if (players[socket.name]) {
            players[socket.name].game = game;
        }
        io.emit('players', players);
    });
    socket.on('disconnect', function() {
        delete players[socket.name];
        io.emit('players', players);
    });
    socket.on('score submit', function(data) {
        data.name = socket.name;
        for (var i = 0; i < scores.length; i++) {
            if (data.score > scores[i].score) {
                scores.splice(i, 0, data);
                break;
            }
        }
        if (!scores || !scores[i]) {
            scores = [data];
        }
        if (scores.length > 100) {
            scores = scores.slice(0, 100);
        }
        fs.writeFile('scores.json', JSON.stringify(scores));
        io.emit('scores', scores);
    });

    io.emit('players', players);
    io.emit('scores', scores);

});


server.listen(2550);