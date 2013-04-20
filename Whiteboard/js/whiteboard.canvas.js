whiteboardCanvas = function(myApp){
    var _initialized = false;
    var _canvas = null;
    var _$canvasElm = null;
    var _stage = null;
    var _shape = null;
    var _mouseIsDown = false;
    var _mousePosition = null;
    var _mousePrevPosition = null;
    var _mousePrevPrevPosition = null;
    var _myBufferedPath = [];
    var _myBroadcastPathInterval = null;
    var that = this;

    var _myThickness = 5;
    var _myColor = "#000000";

    var connectedClients = {};

    var canvasDimension = {
        w: 1024,
        h: 768,
        s: 1
    };

    var myTicker = {};

    var myCurrentShape=null;
    var count;

    this.init = function(){
        if (_initialized == true) return;

        _canvas = document.getElementById("myCanvas");
        _stage = new createjs.Stage(_canvas);
        _$canvasElm = $("#myCanvas");


        _$canvasElm.bind('vmousedown', function(e){
            console.log("vmousedown");
            if(!e){ e = window.event; }

            _mouseIsDown = true;

            _mousePosition = new createjs.Point(e.pageX-_canvas.offsetLeft, e.pageY-_canvas.offsetTop);
            _mousePosition = that.convertPointToPersent(_mousePosition);

            _mousePrevPosition = _mousePosition;
            _mousePrevPrevPosition =_mousePosition;

            that.drawPoint(_myColor,_myThickness, _mousePosition);
            if (myApp.isConnected()){
                that.broadcastPoint(_mousePosition);
                _myBroadcastPathInterval = setInterval(that.broadcastPath, 500);
            }
            e.preventDefault();
        });
        _$canvasElm.bind('vmouseup', function(e){
            console.log("vmouseup");
            _mouseIsDown = false;
            e.preventDefault();
        });
        _$canvasElm.bind('vmousemove', function(e){
            console.log("vmousemove");
            if(_mouseIsDown) {
                _mousePosition = new createjs.Point(e.pageX-_canvas.offsetLeft, e.pageY-_canvas.offsetTop);
                _mousePosition = that.convertPointToPersent(_mousePosition);
            }
            e.preventDefault();
        });

        _shape = new createjs.Shape();
        _stage.addChild(_shape);
        createjs.Ticker.addListener(myTicker);

        var resizeTimeout;
        $(window).bind("resize pageshow",function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(that.fixSize, 100);
        });

        _initialized = true;
    }

    myTicker.tick = function(){
        if(_mouseIsDown) {
            that.drawLine(_myColor, _myThickness, _mousePrevPrevPosition, _mousePrevPosition, _mousePosition );
            _mousePrevPrevPosition = _mousePrevPosition;
            _mousePrevPosition = _mousePosition;
            if (myApp.isConnected()){
                if (_myBufferedPath.length==0 || (_myBufferedPath[_myBufferedPath.length-1].x != _mousePosition.x || _myBufferedPath[_myBufferedPath.length-1].y != _mousePosition.y))
                    _myBufferedPath.push(_mousePosition);
            }
        }
        if (myApp.isConnected()){
            for (var i in connectedClients){
                var buffer = connectedClients[i].buffer;
                for(var b=0;b<buffer.length;b++){
                    switch (buffer[b].cmd){
                        case "point":
                            with(connectedClients[i]){
                                prevPoint = buffer[b].args.point;
                                prePrevPoint = buffer[b].args.point;
                                thickness = buffer[b].args.thickness;
                                color = buffer[b].args.color;
                            }
                            that.drawPoint(connectedClients[i].color, connectedClients[i].thickness, buffer[b].args.point);
                            break;
                        case "path":
                            pathBuffer = buffer[b].args.buffer;
                            for (var j =0; j<pathBuffer.length;j++){
                                that.drawLine(connectedClients[i].color, connectedClients[i].thickness, connectedClients[i].prePrevPoint, connectedClients[i].prevPoint, pathBuffer[j] );
                                connectedClients[i].prePrevPoint = connectedClients[i].prevPoint;
                                connectedClients[i].prevPoint = pathBuffer[j];
                            }
                            break;

                    }
                }
                connectedClients[i].buffer = [];
            }
        }
    };

    this.drawLine = function(lineColor, lineThickness, prePrevPoint, prevPoint, cPoint ){
        if (_initialized == false) {throw "Canvas not initialized yet!"; return;}


        _shape.graphics.setStrokeStyle(lineThickness, "round");
        _shape.graphics.beginStroke(lineColor);

        //http://www.html5canvastutorials.com/tutorials/html5-canvas-quadratic-curves/
        var controlPoint = new createjs.Point(prevPoint.x+cPoint.x>>1, prevPoint.y+cPoint.y>>1);
        _shape.graphics.moveTo(controlPoint.x, controlPoint.y);
        var prevControlPoint = new createjs.Point(prePrevPoint.x+prevPoint.x>>1, prePrevPoint.y+prevPoint.y>>1);
        _shape.graphics.curveTo(prevPoint.x,prevPoint.y,prevControlPoint.x, prevControlPoint.y);

        _stage.update();
    };

    this.convertPointToPersent = function(point){
        return {
            x: point.x / canvasDimension.s,
            y: point.y / canvasDimension.s
        };
    };
    this.convertPointFromPersent = function(point){
        return new createjs.Point(
            point.x * canvasDimension.s,
            point.y * canvasDimension.s
        );
    };
    this.drawPoint = function(color, thickness, point){
        _shape.graphics.setStrokeStyle(1, "round");
        _shape.graphics.beginStroke(color);
        _shape.graphics.beginFill(color);
        _shape.graphics.drawCircle(point.x, point.y, thickness >> 1);
        _shape.graphics.beginFill(null);
        _stage.update();
    };

    this.fixSize = function(){
        if (_initialized == false) {throw "Canvas not initialized yet!"; return;}

        var height = $(window).height() - $(".ui-header:visible").outerHeight() - $(".ui-footer:visible").outerHeight();
        var width = $(window).width();

        $("#pgCanvas .ui-content").css('height', height);
        canvasDimension.s = 1;

        canvasDimension.s = Math.min(width / canvasDimension.w, height / canvasDimension.h);

        var canvasHeight = canvasDimension.s * canvasDimension.h;
        var canvasWidth = canvasDimension.s * canvasDimension.w;

        _$canvasElm.attr('height', canvasHeight);
        _$canvasElm.attr('width', canvasWidth);


        cheight = height;
        cwidth = width;

        console.log("SCALE: "+canvasDimension.s);

        _shape.setTransform ( 0, 0, canvasDimension.s , canvasDimension.s , 0);
        _stage.update();
    };
    this.exit = function(){
        if (_myBroadcastPathInterval!=null) clearInterval(_myBroadcastPathInterval);
        _myBroadcastPathInterval = null;
        _myBufferedPath = [];
        that.clear();
        connectedClients = {};
    };
    this.clear = function(){
        _stage.removeAllChildren();
        _shape = new createjs.Shape();
        _shape.setTransform ( 0, 0, canvasDimension.s , canvasDimension.s , 0);
        _stage.addChild(_shape);
        _stage.update();
    };

    this.getStage = function(){
        return _stage;
    };

    this.getShape = function(){
        return _shape;
    };

    this.broadcastPoint = function(point){
        console.log('send point');
        myApp.broadcast("point", {
            point:point,
            thickness: _myThickness,
            color: _myColor
        })
    };

    this.broadcastPath = function(){
        if (_myBufferedPath.length == 0) {
            return;
        }
        var buffer = _myBufferedPath;
        myApp.broadcast("path", {
            buffer:buffer
        });
        _myBufferedPath = [];
        if (!_mouseIsDown){
            clearInterval(_myBroadcastPathInterval);
        }
    };

    this.processReceivedCommand = function(data){
        console.log("processing command");
        console.log(data);
        if (connectedClients[data.from] == undefined) {
            connectedClients[data.from] = {
                color:"#00F",
                thickness:5,
                buffer:[],
                prevPoint:null,
                prePrevPoint:null
            };
        }
        connectedClients[data.from].buffer.push({
            cmd:data.cmd,
            args:data.args
        });
    };

    this.getColor = function(){
        return _myColor;
    };
    this.setColor = function(rgb){
        _myColor = rgb;
    };


    this.getThickness = function(){
        return _myThickness;
    };
    this.setThickness = function(val){
        _myThickness = val;
    };
};