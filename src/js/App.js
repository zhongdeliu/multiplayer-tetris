/**
 * This is the main application module
 */
angular.module('App', ['Settings', 'Services', 'GameLogic', 'Drawing'])

.controller('GameController', function($scope, $window, BlockFactory, Shapes, Colors, FIELD_UNIT_SIZE, FIELD_SIZE, DrawService, UtilService, PointsService) {
    var KEY = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        SPACE: 32
    };
    var ACTION = KEY;
    ACTION.ROTATE = ACTION.UP;

    var stage;
    var fieldDimension = FIELD_SIZE;
    var fieldValues = [];

    var socket;
    $scope.players = [];
    $scope.chat = [];
    $scope.duellLog = [];
    $scope.isMultiplayer = false;

    $scope.thumbnails = {};
    Object.keys(Shapes).forEach(function(value) {
        $scope.thumbnails[value] = UtilService.renderThumbnail(value);
    });

    $scope.isKeyDown = function(code) {
        //console.log($scope.keys["key" + code]);
        if ($scope.keys["key" + code]) {
            return true;
        }
        return false;
    };

    // Clear KeyEvent
    function clearKeyEvent() {
        for (var code in $scope.keys) {
            if ($scope.keys.hasOwnProperty(code)) {
                $scope.keys[code] = false;
            }
        }
    }

    var gameLoopStart = 0;
    // Game Loop
    function gameLoop(event) {
        var i, j;
        var x;
        var y;
        var r;
        var rowsToRemove = [];
        var currentRow;
        var hasFullRow;

        //No ActiveBlock -> New Block
        if (!$scope.activeBlock) {
            $scope.$apply(function() {
                $scope.activeBlock = $scope.nextBlock;
                $scope.nextBlock = BlockFactory.getRandomBlock();
                $scope.blocksCount[$scope.activeBlock.type].count++;
                $scope.totalBlockCount++;
            });
        }

        //Key Handlers
        if ($scope.isKeyDown(KEY.RIGHT)) {
            if (checkMove(ACTION.RIGHT)) {
                $scope.activeBlock.position.x++;
            }
        }
        else if ($scope.isKeyDown(KEY.LEFT)) {
            if (checkMove(ACTION.LEFT)) {
                $scope.activeBlock.position.x--;
            }
        }

        if ($scope.isKeyDown(KEY.UP)) {
            if (checkMove(ACTION.ROTATE)) {
                $scope.activeBlock.rotation = ($scope.activeBlock.rotation + 1) % 4;
            }
        }
        else if ($scope.isKeyDown(KEY.DOWN)) {
            if (checkMove(ACTION.DOWN)) {
                $scope.activeBlock.position.y++;
            }
        }

        if ($scope.isKeyDown(KEY.SPACE)) {
            for (var h = 0; h < fieldDimension[1]; h++) {
                if (checkMove(ACTION.DOWN)) {
                    $scope.activeBlock.position.y++;
                }
                else {
                    $scope.activeBlock.position.fixed = true;
                    updatePoints({
                        droppedLines: h
                    });
                    break;
                }
            }
            //createjs.Sound.play("Drop");
        }

        clearKeyEvent();

        /* Start Game Loop */
        if (!gameLoopStart) {
            gameLoopStart = event.runTime;
        }
        var timeDiff = event.runTime - gameLoopStart;
        if (timeDiff > $scope.levelStepTime) {
            gameLoopStart = 0;

            if (checkMove(ACTION.DOWN)) {
                $scope.activeBlock.position.y++;
            }
            else {
                //Place Block and get new Block
                x = $scope.activeBlock.position.x;
                y = $scope.activeBlock.position.y;
                r = $scope.activeBlock.rotation;

                if (y < 0) {
                    $scope.$apply(function() {
                        $scope.gameStopped = true;
                        $scope.gameOver = true;
                        createjs.Ticker.removeEventListener("tick", gameLoop);
                    });
                    if (!$scope.isMultiplayer) {
                        socket.emit('score submit', {
                            score: $scope.points,
                            level: $scope.level,
                            rowCount: $scope.rowCount,
                            rowsRecieved: $scope.rowsRecieved,
                            isDuell: $scope.isDuellMode
                        });
                    }
                }
                else {
                    for (i = 0; i < 4; i++) {
                        for (j = 0; j < 4; j++) {
                            if (Shapes[$scope.activeBlock.type][r][i][j]) {
                                fieldValues[y + i][x + j] = {
                                    color: $scope.activeBlock.color
                                };
                            }
                        }
                    }
                    $scope.activeBlock.position.fixed = true;
                }
            }

            if ($scope.activeBlock.position.fixed) {
                //Check for complete rows
                for (i = 0; i < fieldDimension[1]; i++) {
                    for (j = 0; j < fieldDimension[0]; j++) {
                        if (currentRow !== i) {
                            if (hasFullRow) {
                                rowsToRemove.push(currentRow);
                            }
                            currentRow = i;
                            hasFullRow = true;
                        }
                        if (!fieldValues[i][j]) {
                            hasFullRow = false;
                            break;
                        }
                    }
                }
                if (hasFullRow) {
                    rowsToRemove.push(currentRow);
                }
                removeRows(rowsToRemove);

                $scope.activeBlock = false;
            }

            socket.emit('game status', {
                points: $scope.points,
                level: $scope.level,
                rowCount: $scope.rowCount,
                rowPlus: rowsToRemove.length,
                field: stage.toDataURL()
            });
        }

        if (!$scope.gameStopped) {
            drawAll();
        }
    }

    function removeRows(rowsArray) {
        if (rowsArray.length) {
            $scope.rowCount += rowsArray.length;

            rowsArray.forEach(function(row) {
                fieldValues.splice(row, 1);
                fieldValues.unshift(createEmptyRow());
            });

            updatePoints({
                clearedRows: rowsArray.length
            });
            updateLevel();
        }
    }

    function updatePoints(triggerObj) {
        var clearedRows = triggerObj.clearedRows || 0;
        var droppedLines = triggerObj.droppedLines || 0;
        var levelMultiplier = (1 + ($scope.level - 1) / 10);

        var points = PointsService.calculatePoints(clearedRows, droppedLines, levelMultiplier);

        $scope.points = $scope.points + points;
    }

    function updateLevel() {
        $scope.level = Math.floor($scope.rowCount / 10) + 1;
        $scope.levelStepTime = (-20) * ($scope.level + 1) + 500;
        if ($scope.levelStepTime < 0) {
            $scope.levelStepTime = 0;
        }
    }


    function checkMove(direction) {
        var i, j;
        var x = $scope.activeBlock.position.x;
        var y = $scope.activeBlock.position.y;
        var r = $scope.activeBlock.rotation;
        if ($scope.activeBlock.position.fixed) {
            return false;
        }

        switch (direction) {
        case ACTION.ROTATE:
            y = (y === -1) ? 0 : y;
            r = (r + 1) % 4;
            for (i = 0; i < 4; i++) {
                for (j = 0; j < 4; j++) {
                    if (Shapes[$scope.activeBlock.type][r][i][j]) {
                        if (x + j < 0 || x + j >= fieldDimension[0] || y + i >= fieldDimension[1] || fieldValues[y + i][x + j]) {
                            return false;
                        }
                    }
                }
            }
            break;
        case ACTION.DOWN:
            y = y + 1;
            y = (y === -1) ? 0 : y;
            for (i = 0; i < 4; i++) {
                for (j = 0; j < 4; j++) {
                    if (Shapes[$scope.activeBlock.type][r][i][j]) {
                        if (y + i >= fieldDimension[1] || fieldValues[y + i][x + j]) {
                            return false;
                        }
                    }
                }
            }
            break;
        case ACTION.LEFT:
            x = x - 1;
            y = (y === -1) ? 0 : y;
            for (i = 0; i < 4; i++) {
                for (j = 0; j < 4; j++) {
                    if (Shapes[$scope.activeBlock.type][r][i][j]) {
                        if (x + j < 0 || fieldValues[y + i][x + j]) {
                            return false;
                        }
                    }
                }
            }
            break;
        case ACTION.RIGHT:
            x = x + 1;
            y = (y === -1) ? 0 : y;
            for (i = 0; i < 4; i++) {
                for (j = 0; j < 4; j++) {
                    if (Shapes[$scope.activeBlock.type][r][i][j]) {
                        if (x + j >= fieldDimension[0] || fieldValues[y + i][x + j]) {
                            return false;
                        }
                    }
                }
            }
            break;
        }

        return true;
    }


    function drawField() {
        DrawService.drawField({
            fieldDimension: fieldDimension,
            fieldValues: fieldValues,
            stage: stage
        });
    }

    function drawActiveBlock() {
        DrawService.drawBlock({
            block: $scope.activeBlock,
            stage: stage
        });
    }

    function drawAll() {
        stage.removeAllChildren();
        drawField();
        if ($scope.activeBlock) {
            drawActiveBlock();
        }
        stage.update();
    }

    function createEmptyRow() {
        var emptyRow = [];
        for (var j = 0; j < fieldDimension[0]; j++) {
            emptyRow[j] = false;
        }
        return emptyRow;
    }

    function createBlockRow(freeBlock) {
        var row = [];

        for (var j = 0; j < fieldDimension[0]; j++) {
            row[j] = (j !== freeBlock) ? {
                color: '#666'
            } : false;
        }
        return row;
    }

    function initGame() {
        $scope.gameInitialized = true;
        $scope.gameOver = false;

        window.onkeydown = function(e) {
            $scope.keys["key" + e.which] = true;
            e.preventDefault();
        };

        createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
        createjs.Ticker.setFPS(30);

        $scope.points = 0;
        $scope.level = 1;
        $scope.levelStepTime = (-20) * ($scope.level + 1) + 500;
        $scope.keys = {};
        $scope.blocksCount = {};
        $scope.totalBlockCount = 0;
        $scope.rowCount = 0;
        $scope.rowsRecieved = 0;

        Object.keys(Shapes).forEach(function(value) {
            $scope.blocksCount[value] = {
                shape: Shapes[value],
                count: 0
            };
        });

        stage = new createjs.Stage("canvas");
        stage.enableMouseOver(0);
        stage.enableDOMEvents(false);

        for (var i = 0; i < fieldDimension[1]; i++) {
            fieldValues[i] = createEmptyRow();
        }

        $scope.nextBlock = BlockFactory.getRandomBlock();
        $scope.activeBlock = false;
        updateLevel();

        drawAll();
    }

    $scope.stopGame = function() {
        if ($scope.gameOver) {
            return;
        }
        $scope.gameStopped = true;
        gameLoopStart = false;
        createjs.Ticker.removeEventListener("tick", gameLoop);
    };
    $scope.startGame = function() {
        if ($scope.gameOver) {
            return;
        }
        $scope.gameStopped = false;
        createjs.Ticker.addEventListener("tick", gameLoop);
    };
    $scope.resetGame = function() {
        $scope.gameStopped = true;
        gameLoopStart = false;
        createjs.Ticker.removeEventListener("tick", gameLoop);

        initGame();
    };

    $scope.init = function() {
        if (!$scope.inputName) {
            return;
        }
        $scope.playerName = $scope.inputName;

        socket.emit('player join', {
            name: $scope.playerName,
            game: {}
        });

        initGame();
    };

    //Sound stuff
    var audioPath = "assets/";
    var manifest = [
        {id:"Drop", src:"drop.mp3"}
    ];
    createjs.Sound.registerManifest(manifest, audioPath);

    //Socket stuff
    socket = io.connect($window.location.protocol + '//' + $window.location.host);
    socket.on('duell.rowPlus', function(data) {
        if ($scope.isDuellMode) {
            if (data.player !== $scope.playerName) {
                var freeBlock = (Math.random() * fieldDimension[0]) | 0;
                for (var i = data.rowPlus; i--;) {
                    fieldValues.splice(0, 1);
                    fieldValues.push(createBlockRow(freeBlock));
                }
            }
            $scope.$apply(function() {
                $scope.rowsRecieved += data.rowPlus;
                $scope.duellLog.unshift(data);
            });
        }

    });
    socket.on('players', function(players) {
        $scope.$apply(function() {
            $scope.players = players;
        });
    });
    socket.on('scores', function(scores) {
        $scope.$apply(function() {
            $scope.scores = scores;
        });
    });
    socket.on('version', function(version) {
        $scope.$apply(function() {
            $scope.version = version;
        });
    });
});