angular.module('Services', [
    'Settings',
    'Drawing'
])

.service('BlockFactory', function(Shapes, Colors) {
    return {
        getRandomBlock: function() {
            var randomType = Object.keys(Shapes)[Math.floor(Math.random() * Object.keys(Shapes).length)];
            return {
                type: randomType,
                color: Colors[randomType],
                rotation: 0,
                position: {
                    x: 3,
                    y: -1,
                    fixed: false
                }
            };
        },
        getBlock: function(type) {
            return {
                type: type,
                color: Colors[type],
                rotation: 0,
                position: {
                    x: 0,
                    y: 0,
                    fixed: false
                }
            };
        }
    };
})

.service('UtilService', function(DrawService, BlockFactory) {
    return {
        renderThumbnail: function(value) {
            var canvas = document.createElement('canvas');
            canvas.id = 'block_' + value;
            canvas.setAttribute('width', 40);
            canvas.setAttribute('height', 40);
            //document.body.appendChild(canvas);

            var stageBlock = new createjs.Stage(canvas);

            DrawService.drawBlock({
                block: BlockFactory.getBlock(value),
                blockSize: 10,
                stage: stageBlock,
            });
            stageBlock.update();
            return stageBlock.toDataURL();
        }
    };
})


;