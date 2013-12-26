define([], function() {
    var exports = {};
 
    var defaults = {
            wUnit : 200,
            hUnit : 100,
            wPiece : 180,
            lines : 6,
            hContainer : 550,
            hContainerbottom:10,
            diagramContainerSelector :"#diagramContainer",
            //cause diagram width will change, so we use the width of Mevent
            diagramSelector : '#Mevent',
            pieceSelector : '.piece',
            piecesSelector : "#pieces",
            bgSelector : '#diagramBg',
            svgSelector : '#metricLines',
            svgContainerSelector : '#metricLinesContainer',
            pieceLineOffset : 50,
            currentMetricColor : "#9AC600",
            metricColor : "#ddd",
            metricColors :["#9AC600","#cc8a87","#33655a","#d3b942","#b7dad3","#b7dad3"],
            hCanvas : 620}

    var calDiagramArgs = function(event){
        var args = _.clone(defaults)
        args.lineOffset = defaults.hUnit/2
        args.wDiagram = document.querySelector( defaults.diagramSelector).clientWidth
        args.containerLines = parseInt((document.body.clientHeight-200)/defaults.hUnit)
        args.containerGrid = parseInt( args.wDiagram /defaults.wUnit)
        args.pieces = event.pieces.$model
        args.metrics = event.metrics.$model
        args.cols = args.pieces.length > args.containerGrid ? args.pieces.length + 1 : args.containerGrid
        args.wPieces = args.pieces.length*args.wUnit
        args.colOffset = ((args.wDiagram- args.wPieces)/2 + args.wUnit/2)%args.wUnit

        return args
    }

    //render BG
    var renderBg = (function(){
        var rendered = false,
            defaultOpt = {
                    lineWidth: 1,
                    strokeStyle: 'rgb(255,255,255)',
                    fill: '#fff'
                },
            canvas = document.querySelector( defaults.bgSelector ),
            ctx = canvas.getContext("2d")

        var fixLineWidth = (function() {
            var translate = false
            return function(lineWidth) {
                if (lineWidth == 1 && !translate) {
                    translate = true
                    ctx.translate(0.5, 0.5);
                } else if (lineWidth != 1 && translate) {
                    translate = true
                    ctx.translate(-0.5, -0.5);
                }
            }
        })()

        function setOpt(opt) {
            opt = opt || _.extend({},defaultOpt, opt)
            if (opt.hasOwnProperty('lineWidth')) {
                fixLineWidth(opt.lineWidth)
            }
            for (var i in opt) {
                ctx[i] = opt[i]
            }
        }

        function line(startX, startY, endX, endY, opt) {
            setOpt(opt)
            //fix fade side
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        function xline(startX, startY, endX, opt) {
            line(startX, startY, endX, startY, opt)
        }

        function yline(startX, startY, endY, opt) {
            line(startX, startY, startX, endY, opt)
        }

        return function( args ){
            var canvasWidth = _.max([args.wPieces ,args.wDiagram])
            canvas.width = canvasWidth
            canvas.height = args.hCanvas

            if( _.isEmpty(args.metrics) || rendered){
                console.log("DEB: clear background!")
                ctx.clearRect ( 0 , 0 , canvasWidth , args.hCanvas )
                return 
            }

            renderMatrix( args.wUnit, 
                args.hUnit, 
                args.cols, 
                args.lines, 
                args.colOffset, 
                args.hUnit/2 )

            function renderMatrix(colWidth, lineHeight, cols, lines, colOffset, lineOffset) {
                colOffset = colOffset || 0
                lineOffset = lineOffset || 0
                for (var i = 0; i < cols+1; i++) {
                    yline(i * colWidth + colOffset, (lines-1) * lineHeight + lineOffset, 0)
                }
                for (var j = 0; j < lines; j++) {
                    xline(0, j * lineHeight + lineOffset, canvasWidth)
                }
            }
        }
    })()

    ////////////////////////////////////
    //TODO
    //计算DOM布局，要分metric！！！
    ////////////////////////////////////
  
    function inDiagramArea(e){
        var y = e.pageY? e.pageY : e.clientY + document.body.scrollTop  - document.body.clientTop,
            $diagramContainer = $(defaults.diagramContainerSelector)

        return ( y > $diagramContainer.offset().top 
            && y < $diagramContainer.offset().top + $diagramContainer.outerHeight() ) ? true : false
    }

    var bindWheelEvent = (function(){
        var hasScroll = false,
            mouseIn = false,
            viewMode 

        var eventName = "mousewheel";
        try {
            //FF需要用DOMMouseScroll事件模拟mousewheel事件
            document.createEvent("MouseScrollEvents");
            eventName = "DOMMouseScroll"
        } catch (e) {
        }

        var domRef = document.querySelector(defaults.diagramContainerSelector)
        scrollMaxWidth = 0

        document.addEventListener(eventName, function(e) {
            if ( hasScroll && inDiagramArea(e) && viewMode == 'event') { // 只有滚动条出现时才进入此分支
                //stop y scroll
                e.preventDefault()
                e.stopPropagation()
                var unit = 0,
                    scrollWidth = 0,
                    speed = 15


                if (eventName == "DOMMouseScroll") {
                    unit = (e.detail / 3)
                } else {//如果滚得太快，会出现240， 360等值，全部统一为-1与1
                    unit = e.wheelDelta > 0 ? -1 : 1
                }
                scrollWidth = Math.floor( unit * speed)

                if( domRef.scrollLeft + scrollWidth > scrollMaxWidth ){
                    domRef.scrollLeft = scrollMaxWidth
                }else if( domRef.scrollLeft + scrollWidth < 0){
                    domRef.scrollLeft= 0
                }else{
                    domRef.scrollLeft += scrollWidth
                }
                
            }
        })

        return function( args, vMode ){
            viewMode = vMode
            hasScroll = args.wDiagram < args.wPieces ? true : false
            scrollMaxWidth = hasScroll ? args.wPieces - args.wDiagram : 0
            console.log("bind wheel Event",args.wDiagram,args.wPieces,args.wDiagram-args.wPieces)

        }

    })()



    var renderDom = function( event, diagramArgs, viewMode ){
        var pieces = document.querySelectorAll(diagramArgs.pieceSelector),
            isShortcutModel = (viewMode!="event") ? true:false,
            positionKey = isShortcutModel ? 'shortcut-position' : 'position',
            $pieces = $(diagramArgs.piecesSelector),
            diagramContainer = document.querySelector(defaults.diagramContainerSelector)

        $pieces.width(diagramArgs.wPieces)
        if( !isShortcutModel ){
            if( !$pieces.data("originHeight")){
                $pieces.data("originHeight",$pieces.height())
            }else{
                $pieces.height( $pieces.data("originHeight"))
            }
        }else{
            $pieces.height( _.reduce(pieces,function(memo,piece){
                return memo + $(piece).outerHeight() + 10
            },0))
            diagramContainer.scrollLeft = 0
        }
        
        console.log("DEB: rendering DOM", pieces.length,diagramArgs.wPieces, positionKey)
        
        //caculate positions
        if( pieces.length > 1 && !$(pieces[0]).data(positionKey)){
            diagramArgs.piecesPos = []
            //caculate for unshortcut model
            var metricsKeys = _.keys(event.metrics.$model)
            for( var i=0,length=metricsKeys.length;i<length;i++ ){
                var metricName = metricsKeys[i],
                    metricTop = event.metrics[metricName].top,
                    metricBottom = event.metrics[metricName].bottom,
                    metricRange = metricTop - metricBottom,
                    tempbottomDomHeight = 330,
                    bottomDomHeight = $(_.max( _.map( pieces, function( piece){
                        // console.log( "max ",metricTop , piece['data-piece'].metrics[metricName] )
                        var bottom = (metricTop - piece['data-piece'].metrics[metricName])*(diagramArgs.hContainer-tempbottomDomHeight-diagramArgs.hContainerbottom)/(metricTop-tempbottomDomHeight) 
                            + $(piece).outerHeight()
                        return [piece, bottom]
                    }),function(pieceWithbottom){
                        return pieceWithbottom[1]
                    })).outerHeight()

                    // console.log( "bottom", metricName, bottomDomHeight)
                
                _.each(pieces, function( piece, j){
                    var pieceVm = piece['data-piece'],
                        pieceMetric = pieceVm.metrics[metricName],
                        position = $(piece).data(positionKey) || {}

                    position[metricName] = {
                        left : j*diagramArgs.wUnit + (diagramArgs.wUnit-diagramArgs.wPiece)/2,
                        top : (metricTop - pieceMetric)*(diagramArgs.hContainer-bottomDomHeight-diagramArgs.hContainerbottom)/(metricTop-metricBottom)
                    }
                    
                    $(piece).data('position', position)

                    if( i == length-1 ){
                        // console.log("DEB: setting position for piece", positionKey,position)
                        diagramArgs.piecesPos.push( position )
                    }
                })
            }

            //caculate for shortcut model
            var stack = 0    
            _.each(pieces, (function( piece, i ){
                return function( piece, i){
                    $(piece).data('shortcut-position', {
                        top: stack
                    })
                    stack += $(pieces[i]).outerHeight() + 10
                }
            })())
            console.log("DEB: shortcut model")
        }else{
            if( pieces.length !=0 && $(pieces[0]).data(positionKey)){
                console.log("DEB: piece Dom aready have position", viewMode, positionKey)
            }
        }

        //imply positions
        _.each(pieces, function( piece,j){
            if( !isShortcutModel){
                $(piece).css( _.extend({
                    left : j*diagramArgs.wUnit + (diagramArgs.wUnit-diagramArgs.wPiece)/2
                    },$(piece).data(positionKey)?$(piece).data(positionKey)[event.currentMetric]: {top:10}))
            }else{
                $(piece).css( _.extend({
                    left : 10
                },$(piece).data(positionKey) ))
            }
        })

        bindWheelEvent(diagramArgs,viewMode)

        return pieces
    }

    // must execute after renderDom, cause we need div.piece position
    var renderSvg = (function(){
        var rendered = false,
            svg,
            paths = {},
            lastId,
            lastPieceLength


        return function(event, diagramArgs, viewMode, diagramRendered){

            if( viewMode != 'event' ){
                return
            }
            function setOpt(ele, opt){
                ele.attr( _.extend({
                    stroke: diagramArgs.metricColor,
                    strokeWidth: 5,
                    r:4,
                    strokeOpacity : 0.5,
                    fill : 'none'
                },opt))
            }

            function circle( x, y, r, opt){
                var c = svg.circle( x,y,r)
                setOpt( c, opt)
                return c
            }

            function makePath( points ){
                return "M" + points.map( function(point){
                    return point.toString() + " " +point.toString()
                }).join(" L")
            }

            function renderPath( points, metric,index ){
                var pathStr = makePath(points)
                var path = svg.path( pathStr )
                var opt = {
                    stroke : diagramArgs.metricColors[index]
                }
                setOpt( path, opt)
                
                dots = renderDots( points,metric, diagramArgs.metricColors[index] )
                paths[metric] = svg.g( path, dots )
            }

            function renderDots( points, metric, color ){
                var opt = {
                    fill: color,
                    stroke : color
                },circles = svg.g()
                
                for( var i in points ){
                    circles.add( circle( points[i][0], points[i][1],4,opt) )
                }
                return circles
            }

            function setCurrentPath( metric ){
                metric && paths[metric].attr({
                    strokeOpacity : 0.5
                })
            }

            svg = svg || Snap( diagramArgs.svgSelector)

            if( arguments.length == 1 ){
                //if we only want to set current path
                console.log("DEB: only set current metric for svg")
                return setCurrentPath( arguments[0] )
            }else{
                if( rendered ){
                    console.log("DEB: svg second rendering")
                    if( lastId == event.id && lastPieceLength == event.pieces.length){
                        return 
                    }else{
                        svg.clear()
                    }
                }else{
                    console.log("DEB: svg first rendering")
                }
                $(diagramArgs.svgContainerSelector).width(diagramArgs.wPieces)

                var index = 0
                _.each( _.keys(event.metrics.$model), function(metric){
                    var points = [];

                    for( var i in diagramArgs.piecesPos ){
                        // points.push( (j*diagramArgs.wUnit + diagramArgs.colOffset).toString()
                        //  + " " 
                        //  + (diagramArgs.piecesPos[i][j]).toString())
                        points.push([diagramArgs.piecesPos[i][metric].left + diagramArgs.wPiece/2,
                            diagramArgs.piecesPos[i][metric].top + diagramArgs.pieceLineOffset])
                    }
                    // console.log("DEB: SVG points", points)
                    renderPath( points, metric, index )
                    index++
                })
                setCurrentPath( event.currentMetric )
                lastId = event.id
                lastPieceLength = event.pieces.length
                rendered = true
            }
        }
    })()

    exports.render = (function( vmodel ){
        var rendered = false
        return function( vmodel, general ){
            var diagramArgs = calDiagramArgs( vmodel )
            
            renderBg( diagramArgs )
            renderDom( vmodel, diagramArgs, general.viewMode )
            renderSvg( vmodel, diagramArgs, general.viewMode )

            if( rendered ){
                console.log("DEB: diagram render sencond time!")
            }else{
                console.log("DEB: rendering diagram for the first time")

                general.$watch('viewMode',function( viewMode ){
                    if( !vmodel.loading ){
                        console.log( "DEB: view changed, rerendering diagram",arguments)
                        diagramArgs = calDiagramArgs( vmodel )
                        renderDom( vmodel, diagramArgs, viewMode)
                        renderSvg( vmodel, diagramArgs, viewMode )
                    }
                })
                vmodel.$watch('currentMetric',function( metricName){
                    if( !vmodel.loading ){
                        diagramArgs = calDiagramArgs( vmodel )
                        renderDom( vmodel, diagramArgs, general.viewMode)
                        renderSvg()
                    }
                })
            }

            rendered = true
        }
    })() 

    exports.preRender = function(){
        console.log("DEB: diagram preRender")
    }


    return exports

})