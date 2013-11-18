define([], function(  ) {
    var exports = {};
 
    //render BG
    exports.renderBg = (function(){
        var ctx = document.getElementById("myCanvas").getContext("2d");

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

        var setOpt = (function() {
            var defaultOpt = {
                lineWidth: 1,
                strokeStyle: 'rgb(255,255,255)',
                fill: '#fff'
            }
            return function(opt) {
                opt = opt || defaultOpt
                if (opt.hasOwnProperty('lineWidth')) {
                    fixLineWidth(opt.lineWidth)
                }
                for (var i in opt) {
                    ctx[i] = opt[i]
                }
            }
        })()

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

        return function( diagramArgs ) {
            yline( 0, 0, diagramArgs.hUnit * (diagramArgs.lines-1) + diagramArgs.hUnit/2)
            renderMatrix( diagramArgs.wUnit, diagramArgs.hUnit, 
                diagramArgs.cols, diagramArgs.lines, 
                diagramArgs.wUnit/2, diagramArgs.hUnit/2 )
        }
    })()

    var eventVm
    exports.renderDom = function( event, diagramArgs ){
        //todo 需要计算param的dom最低到哪个位置。
        var domBottom = 300,
            bottomPadding = 10,
            currentMetric = event.defaultMetric || _.keys( event.metrics)[0],
            metricTop = _.max(event.params.map(function(param){return param.metric[currentMetric]})),
            metricBottom = _.min(event.params.map(function(param){return param.metric[currentMetric]}))

        eventVm = avalon.define("event",function(vm){
            _.extend( vm, event)
            vm.params = standardParams( vm.params )
            vm.currentMetric = currentMetric
            vm.metricTop = metricTop
            vm.metricBottom = metricBottom
            vm.domBottom = domBottom
            vm.currentParam = null
            vm.detailParam = null

            vm.active = function(){
                for( var i=0,length=eventVm.params.length;i<length;i++){
                    if( eventVm.params[i].id == this.$vmodel.param.id ){
                        eventVm.currentParam = {
                            index: i,
                            param : eventVm.params[i].$model
                        }
                    }
                }
            }
            vm.unactive = function(){
                eventVm.currentParam= null
            }
            vm.setDetailParam = function(){
                page(baseUrl+"/#aaaa")
            }
            vm.clearDetailParam = function(){
                page(baseUrl)
            }
        })
        avalon.scan()

        var $paramDoms = $('.'+diagramArgs.paramClass)
        var bottomDom = _.max( $paramDoms, function( paramDom ){
            // console.log( $(paramDom), $(paramDom).offset().top, $(paramDom).outerHeight(),$(paramDom).offset().top + $(paramDom).outerHeight())
            return $(paramDom).offset().top + $(paramDom).outerHeight()
        })
        eventVm.domBottom = diagramArgs.hContainer - $(bottomDom).outerHeight() - bottomPadding;
        // console.log( eventVm.domBottom, diagramArgs.hContainer, $(bottomDom).outerHeight(), $(bottomDom))

        //TODO add param positionn to diagramArgs
        diagramArgs.domBottom = eventVm.domBottom
        diagramArgs.paramsPos = {}
        //init position data structure
        _.keys( event.metrics).map(function(metric){
            diagramArgs.paramsPos[metric] = []
        })
        //fill positions group by metric
        $paramDoms.each(function(){
            diagramArgs.paramsPos[currentMetric].push( parseInt( $(this).position().top ) )
        })

        function standardParams( params ){
            var oneDay = 24*60*60*1000
            for( var i=0,length=params.length;i<length;i++){
                if( i > 0 ){
                    params[i].fromLast = Math.ceil((params[i].time-params[i-1].time)/oneDay).toString()+'天'
                }
                params[i].timeText = moment(params[i].time).format('YYYY-MM-DD')

                params[i].isActive = false
            }
            return params
        }
        
    }


    exports.renderSvg = (function(){
        var s = Snap("#mySvg")

        var setOpt = (function(){
            var defaultOpt = {
                stroke: "#fff",
                strokeWidth: 2,
                fill : '#fff'
            }
            return function( ele, opt ){
                opt = opt || defaultOpt
                ele.attr( opt )
            }
        })()

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
            var c = s.circle( x,y, r)
            setOpt( c, opt)
            return c
        }

        function renderPath( pathStr, color ){
            var path = s.path( pathStr )
            //TODO add dot
            setOpt( path, {fill:"none",stroke: color ,strokeWidth:5,strokeOpacity:0.5})
        }

        function makePath( points ){
            return "M" + points.join(" L")
        }

        return function( params, diagramArgs ){
            for( var i in diagramArgs.paramsPos){
                var points = [];
                if( diagramArgs.paramsPos[i].length != 0 ){
                    for( var j in diagramArgs.paramsPos[i] ){
                        points.push( (j*diagramArgs.wUnit + diagramArgs.colOffset).toString()
                         + " " 
                         + (diagramArgs.paramsPos[i][j]).toString())
                    }
                    renderPath( makePath(points),"#9AC600")

                }
                // console.log( points)
            }
            // console.log( )
            // renderPath( "M100 250 L300 100 L550 400 L700 210","#9AC600")
            // renderPath( "M100 350 L300 200 L550 100 L700 210", "#ddd")
        }
    })()




    // function renderBracket( startX, startY, height, width ){
    //     var qx1 = startX,
    //         qy1 = startY + height/2,
    //         xm1 = startX + width/4,
    //         ym1 = startY + height/2,
    //         qx2 = startX + width/2,
    //         qy2 = startY + height/2
    //         xm2 = xm1 + width/2,
    //         ym2 = ym1,
    //         bottomX = startX + width/2,
    //         bottomY = startY + height,
    //         endX = startX + width,
    //         endY = startY;

    //     var bracket = s.path([
    //         "M"+startX,startY,
    //         "Q"+qx1, qy1,
    //         xm1, ym1,
    //         "T"+bottomX,bottomY,
    //         "Q"+qx2,qy2,
    //         xm2,ym2,
    //         "T"+endX,endY
    //         ].join(" "))

    //     setOpt(bracket,{fill:"none",stroke:"#ccc",stokeWidth:1})
    // }



    function calDiagramArgs( event, calDiagramArgs ){

        var wUnit = 200,
            hUnit = 100,
            wParam = 180,
            params = event.params,
            metrics = event.metrics,
            containerGrid = parseInt(document.body.clientWidth/wUnit),
            cols = params.length > containerGrid ? params.length + 1 : containerGrid,
            colOffset = wUnit/2,
            containerLines = parseInt((document.body.clientHeight-200)/hUnit),
            //we don't support responsive diagram for 1st edition.
            // lines = containerLines > 6 ? containerLines : 6,
            lines = 6,
            lineOffset = hUnit/2,
            hContainer = 550,
            paramClass = 'param'

        return {
            wUnit : wUnit,
            hUnit : hUnit,
            wParam : wParam,
            cols : cols,
            lines : lines,
            hContainer : hContainer,
            paramClass : paramClass,
            colOffset : colOffset,
            lineOffset : lineOffset
        }
    }

    exports.render = function(){
        $.getJSON("./data/event.json").done(function( res ){
            var diagramArgs = calDiagramArgs( res )
            exports.renderBg( diagramArgs )
            exports.renderDom( res, diagramArgs )
            exports.renderSvg( res, diagramArgs )
            // exports.renderTimeAxis( res.params)
        }).error(function( err ){
            console.log( 'err', err)
        })
    } 


    //router
    var baseUrl = "/E:/work/projects/Jubo/select.html"
    page("*",function( context ){
        console.log("don't go",arguments)
        if( context.hash ){
            $.getJSON("./data/detailParam.json").done(function(res){
                eventVm.detailParam = res 
                console.log( res )
            })
        }else if(eventVm){
            eventVm.detailParam = null
        }
    })
    page()


    return exports

})