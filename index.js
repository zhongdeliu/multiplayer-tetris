var dbConfig = require('./db.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');

var packagejson = require('./package.json');

app.use('/', express.static('src'));

var players = {};

mongoose.connect(dbConfig.mongoConnection);
var scoreSchema = mongoose.Schema({
    name: String,
    score: Number,
    level: Number,
    rowCount: Number,
    rowsRecieved: Number,
    isDuell: Boolean
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
    socket.on('game status', function(game) {
        if (players[socket.name]) {
            players[socket.name].game = game;
        }
        io.emit('players', players);
        
        if (game.rowPlus > 1) {
            io.emit('duell.rowPlus', {
                player: socket.name,
                rowPlus: game.rowPlus - 1
            });    
        }
    });
    socket.on('disconnect', function() {
        delete players[socket.name];
        io.emit('players', players);
    });
    socket.on('score submit', function(data) {
        data.name = socket.name;
        
        var scoreEntry = new Score(data);
        scoreEntry.save();
        Score.find().sort({score: -1}).limit(100).exec(function(err, scoresData) {
            if (err) return console.error(err);
            io.emit('scores', scoresData);
        });
    });

    io.emit('players', players);
    Score.find().sort({score: -1}).limit(100).exec(function(err, scoresData) {
        if (err) return console.error(err);
        io.emit('scores', scoresData);
    });
    
    io.emit('version', packagejson.version);

});


server.listen(process.env.PORT || 2550);