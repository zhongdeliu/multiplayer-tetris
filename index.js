var dbConfig = require('./db.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');

app.use('/', express.static('src'));

var players = {};

mongoose.connect(dbConfig.mongoConnection);
var scoreSchema = mongoose.Schema({
    name: String,
    score: Number,
    level: Number,
    rowCount: Number
});
var Score = mongoose.model('Score', scoreSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
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
        
        var scoreEntry = new Score(data);
        scoreEntry.save();
        Score.find().sort({date: -1}).exec(function(err, scoresData) {
            if (err) return console.error(err);
            io.emit('scores', scoresData);
        });
    });

    io.emit('players', players);
    Score.find().sort({date: -1}).exec(function(err, scoresData) {
        if (err) return console.error(err);
        io.emit('scores', scoresData);
    });
    

});


server.listen(process.env.PORT || 2550);