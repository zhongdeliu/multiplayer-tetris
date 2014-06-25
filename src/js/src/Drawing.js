angular.module('Drawing', [
    'Settings'
])

.service('DrawService', function(Shapes, FIELD_UNIT_SIZE) {
    return {
        drawBlock: function(object) {
            var borderColor = object.borderColor || '#333333';
            var block = object.block;
            var blockSize = object.blockSize || FIELD_UNIT_SIZE;
            var stage = object.stage;

            var rect;

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (Shapes[block.type][block.rotation][i][j]) {
                        rect = new createjs.Shape();
                        rect.graphics.beginStroke(borderColor);
                        rect.graphics.beginFill(block.color);
                        rect.graphics.drawRect(block.position.x * blockSize + blockSize * j, block.position.y * blockSize + blockSize * i, blockSize, blockSize);
                        stage.addChild(rect);
                    }
                }
            }
        },
        drawField: function(object) {
            var fieldDimension = object.fieldDimension;
            var fieldValues = object.fieldValues;
            var stage = object.stage;
            var rect;
            var fillColor;

            for (var i = 0; i < fieldDimension[1]; i++) {
                for (var j = 0; j < fieldDimension[0]; j++) {
                    fillColor = "#ffffff";
                    if (fieldValues[i][j]) {
                        fillColor = fieldValues[i][j].color;
                    }
                    rect = new createjs.Shape();
                    rect.graphics.beginStroke("#cccccc");
                    rect.graphics.beginFill(fillColor);
                    rect.graphics.drawRect(FIELD_UNIT_SIZE * j, FIELD_UNIT_SIZE * i, FIELD_UNIT_SIZE, FIELD_UNIT_SIZE);
                    stage.addChild(rect);
                }
            }
        }
    };
})

;