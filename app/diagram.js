define([], function(  ) {
    var exports = {};
 
    function calDiagramArgs( event, calDiagramArgs ){

        var args = {
            wUnit : 200,
            hUnit : 100,
            wParam : 180,
            params : event.params,
            metrics : event.metrics,
            lines : 6,
            hContainer : 550,
            hContainerbottom:10,
            paramSelector : '.param',
            bgSelector : '#diagramBg',
            svgSelector : '#metricLines',
            paramLineOffset : 50,
            currentMetricColor : "#9AC600",
            metricColor : "#ddd"
        } 

        args.containerGrid = parseInt(document.body.clientWidth/args.wUnit)
        args.cols = args.params.length > args.containerGrid ? args.params.length + 1 : args.containerGrid
        args.colOffset = args.wUnit/2
        args.containerLines = parseInt((document.body.clientHeight-200)/args.hUnit)
        args.lineOffset = args.hUnit/2

        return args

    }

    //render BG
    var renderBg = function( diagramArgs ){
        var ctx = document.querySelector( diagramArgs.bgSelector ).getContext("2d");
        var defaultOpt = {
            lineWidth: 1,
            strokeStyle: 'rgb(255,255,255)',
            fill: '#fff'
        }

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

        var setOpt = function(opt) {
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


        function renderMatrix(colWidth, lineHeight, cols, lines, colOffset, lineOffset) {
            colOffset = colOffset || 0
            lineOffset = lineOffset || 0
            for (var i = 0; i < cols; i++) {
                yline(i * colWidth + colOffset, (lines-1) * lineHeight + lineOffset, 0)
            }
            for (var j = 0; j < lines; j++) {
                xline(0, j * lineHeight + lineOffset, colWidth * cols)
            }
        }

        
        yline( 0, 0, diagramArgs.hUnit * (diagramArgs.lines-1) + diagramArgs.hUnit/2)
        renderMatrix( diagramArgs.wUnit, 
            diagramArgs.hUnit, 
            diagramArgs.cols, 
            diagramArgs.lines, 
            diagramArgs.wUnit/2, 
            diagramArgs.hUnit/2 )
    }

    ////////////////////////////////////
    //TODO
    //计算DOM布局，要分metric！！！
    ////////////////////////////////////

    var renderDom = function( event, diagramArgs ){
        var params = document.querySelectorAll(diagramArgs.paramSelector),
            isDetailParamSet = (event.view=="detailParam") ? true:false,
            positionKey = isDetailParamSet ? 'position' : 'shortcut-position'

            console.log("isDetailParamSet"  ,isDetailParamSet)
        if( params.length!=0 && !$(params[0]).data(positionKey)){
            diagramArgs.paramsPos = []
            if( !isDetailParamSet ){
                for( var j=0,length=event.metricsKeys.length;j<length;j++){
                    var metric = event.metricsKeys[j]
                        metricTop = _.max(event.params.map(function(param){return param.metric[metric]})),
                        metricBottom = _.min(event.params.map(function(param){return param.metric[metric]})),
                        metricRange = metricTop - metricBottom,
                        // console.log( params )
                        bottomDomHeight = $(_.min( params, function( param){ return param['data-param'].metric[metric]})).outerHeight()
                    
                    _.each(params, function( param, i){
                        var paramVm = param['data-param'],
                            paramMetric = paramVm.metric[metric],
                            position = $(param).data(positionKey) || {}

                        position[metric] = {
                            left : i*diagramArgs.wUnit+10,
                            top : (metricTop - paramMetric)*(diagramArgs.hContainer-bottomDomHeight-diagramArgs.hContainerbottom)/(metricTop-metricBottom)
                        }
                        
                        $(param).data(positionKey, position)

                        // paramVm.el = {position:position}
                        if( j == length-1 ){
                            diagramArgs.paramsPos.push( position )
                        }
                    })
                }
            }else{
                _.each(params, (function( ){
                    // console.log( $(params[i-1]).outerHeight() +10)
                    var stack = 0
                    return function( param, i){
                        $(param).data(positionKey, {
                            left:0,
                            top: stack
                        })
                        stack += $(params[i]).outerHeight() + 10
                    }
                })())
            }
        }

        _.each(params, function( param){
            if( !isDetailParamSet ){
                $(param).css( $(param).data(positionKey)[event.currentMetric] )
            }else{
                $(param).css( $(param).data(positionKey) )
            }
        })

        return params
    }

    // must execute after renderDom, cause we need div.param position
    var renderSvg = function(event, diagramArgs){
        var s = Snap( diagramArgs.svgSelector)

        var setOpt = function(ele, opt){
            ele.attr( _.extend({
                stroke: diagramArgs.metricColor,
                strokeWidth: 5,
                r:4,
                strokeOpacity : 0.5,
                fill : 'none'
            },opt))
        }

        function yline( startX, startY, endY, opt){
            var line = s.line(startX,startY, startX, endY)
            setOpt( line, opt )
            return line;
        }   

        function xline( startX, startY, endX, opt){
            var line = s.line(startX,startY, endX, startY)
            setOpt( line, opt )
            return line;
        }

        function circle( x, y, r, opt){
            console.log( )
            var c = s.circle( x,y,r)
            setOpt( c, opt)
            return c
        }

        function makePath( points ){
            return "M" + points.map( function(point){
                return point.toString() + " " +point.toString()
            }).join(" L")
        }

        function renderPath( points, current ){
            var pathStr = makePath(points)
            var path = s.path( pathStr )
            var opt = {}
            if( current ){
                opt.stroke = diagramArgs.currentMetricColor
            }

            setOpt( path, opt)
            //TODO add dot
            renderDots( points, current )
        }

        function renderDots( points, current ){
            var opt = {fill:diagramArgs.metricColor}
            if( current ){
                opt.stroke = diagramArgs.currentMetricColor
            }
            for( var i in points ){
                circle( points[i][0], points[i][1],4,opt)
            }
        }



        ///////////////////////////////////////////
        //TODO
        //分Metric重新划线
        ///////////////////////////////////////////
        event.metricsKeys.forEach(function(metric){
            var points = [];

            for( var i in diagramArgs.paramsPos ){
                // points.push( (j*diagramArgs.wUnit + diagramArgs.colOffset).toString()
                //  + " " 
                //  + (diagramArgs.paramsPos[i][j]).toString())
                points.push([diagramArgs.paramsPos[i][metric].left + diagramArgs.wUnit/2,
                    diagramArgs.paramsPos[i][metric].top + diagramArgs.paramLineOffset])
            }
            renderPath( points, metric == event.currentMetric )

            // console.log( points)

        })
    }

    exports.render = function( vmodel ){
        var diagramArgs = calDiagramArgs( vmodel )
        renderBg( diagramArgs )
        renderDom( vmodel, diagramArgs )
        renderSvg( vmodel, diagramArgs )

        vmodel.$watch('view',function(){
            console.log( "view changed",arguments)
            renderDom( vmodel, diagramArgs)
        })
    } 

    exports.preRender = function(){
        console.log("loading events...")
    }


    return exports

})