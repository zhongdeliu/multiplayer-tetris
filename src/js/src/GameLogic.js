angular.module('GameLogic', [])

.service('PointsService', function() {
    return {
        calculatePoints: function(clearedRows, droppedLines, levelMultiplier) {
            var points = 0;

            switch (clearedRows) {
                case 1:
                    points = 100;
                    break;
                case 2:
                    points = 200;
                    break;
                case 3:
                    points = 400;
                    break;
                case 4:
                    points = 800;
                    break;
            }
            points = points + droppedLines;

            return Math.floor(points * levelMultiplier);
        }
    };
})

;