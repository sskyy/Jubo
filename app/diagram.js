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
            svgSelector : '#metricLines'
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
        //todo 需要计算param的dom最低到哪个位置。
        // var domBottom = 300,
        //     bottomPadding = 10,
        //     currentMetric = event.defaultMetric || _.keys( event.metrics)[0],
        //     metricTop = _.max(event.params.map(function(param){return param.metric[currentMetric]})),
        //     metricBottom = _.min(event.params.map(function(param){return param.metric[currentMetric]}))

        // eventVm = avalon.define("event",function(vm){
        //     _.extend( vm, event)
        //     vm.params = standardParams( vm.params )
        //     vm.currentMetric = currentMetric
        //     vm.metricTop = metricTop
        //     vm.metricBottom = metricBottom
        //     vm.domBottom = domBottom
        //     vm.currentParam = null
        //     vm.detailParam = null

        //     vm.active = function(){
        //         for( var i=0,length=eventVm.params.length;i<length;i++){
        //             if( eventVm.params[i].id == this.$vmodel.param.id ){
        //                 eventVm.currentParam = {
        //                     index: i,
        //                     param : eventVm.params[i].$model
        //                 }
        //             }
        //         }
        //     }
        //     vm.unactive = function(){
        //         eventVm.currentParam= null
        //     }
        //     vm.setDetailParam = function(){
        //         page(baseUrl+"/#aaaa")
        //     }
        //     vm.clearDetailParam = function(){
        //         page(baseUrl)
        //     }
        // })
        // avalon.scan()

        // var $paramDoms = $('.'+diagramArgs.paramClass)
        // var bottomDom = _.max( $paramDoms, function( paramDom ){
        //     // console.log( $(paramDom), $(paramDom).offset().top, $(paramDom).outerHeight(),$(paramDom).offset().top + $(paramDom).outerHeight())
        //     return $(paramDom).offset().top + $(paramDom).outerHeight()
        // })
        // eventVm.domBottom = diagramArgs.hContainer - $(bottomDom).outerHeight() - bottomPadding;
        // // console.log( eventVm.domBottom, diagramArgs.hContainer, $(bottomDom).outerHeight(), $(bottomDom))

        // //TODO add param positionn to diagramArgs
        // diagramArgs.domBottom = eventVm.domBottom
        // diagramArgs.paramsPos = {}
        // //init position data structure
        // _.keys( event.metrics).map(function(metric){
        //     diagramArgs.paramsPos[metric] = []
        // })
        // //fill positions group by metric
        // $paramDoms.each(function(){
        //     diagramArgs.paramsPos[currentMetric].push( parseInt( $(this).position().top ) )
        // })

        // function standardParams( params ){
        //     var oneDay = 24*60*60*1000
        //     for( var i=0,length=params.length;i<length;i++){
        //         if( i > 0 ){
        //             params[i].fromLast = Math.ceil((params[i].time-params[i-1].time)/oneDay).toString()+'天'
        //         }
        //         params[i].timeText = moment(params[i].time).format('YYYY-MM-DD')

        //         params[i].isActive = false
        //     }
        //     return params
        // }

        var params = document.querySelectorAll(diagramArgs.paramSelector)
        if( params.length!=0 && ! $(params[0]).data('position')){
            diagramArgs.paramsPos = []
            for( var j=0,length=event.metricsKeys.length;j<length;j++){
                var metric = event.metricsKeys[j]
                    metricTop = _.max(event.params.map(function(param){return param.metric[metric]})),
                    metricBottom = _.min(event.params.map(function(param){return param.metric[metric]})),
                    metricRange = metricTop - metricBottom,
                    bottomDomHeight = $(_.min( params, function( param){ return param['data-param'].metric[metric]})).outerHeight()
                
                _.each(params, function( param, i){
                    var paramVm = param['data-param'],
                        paramMetric = paramVm.metric[metric],
                        position = $(param).data('position') || {}

                    position[metric] = {
                        left : i*diagramArgs.wUnit+10,
                        top : (metricTop - paramMetric)*(diagramArgs.hContainer-bottomDomHeight-diagramArgs.hContainerbottom)/(metricTop-metricBottom)
                    }
                    $(param).data('position', position)
                    // $(param).css({'visibility':'visible'})

                    // paramVm.el = {position:position}
                    if( j == length-1 ){
                        diagramArgs.paramsPos.push( position )
                    }
                })
            }
        }

        _.each(params, function( param){
            $(param).css( $(param).data('position')[event.currentMetric] )
        })

        return params
    }

    // must execute after renderDom, cause we need div.param position
    var renderSvg = function(event, diagramArgs){
        var s = Snap( diagramArgs.svgSelector)

        var setOpt = function(ele, opt){
            ele.attr( _.extend({
                stroke: "#fff",
                strokeWidth: 2,
                fill : '#fff'
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

        ///////////////////////////////////////////
        //TODO
        //分Metric重新划线
        ///////////////////////////////////////////
        console.log( event.metricsKeys)
        event.metricsKeys.forEach(function(metric){
            var points = [];

            for( var i in diagramArgs.paramsPos ){
                // points.push( (j*diagramArgs.wUnit + diagramArgs.colOffset).toString()
                //  + " " 
                //  + (diagramArgs.paramsPos[i][j]).toString())
                points.push( (diagramArgs.paramsPos[i][metric].left + diagramArgs.wUnit/2).toString() +" "+
                    (diagramArgs.paramsPos[i][metric].top + 50).toString() )
            }
            renderPath( makePath(points),"#9AC600")

            console.log( points)

        })
    }

    exports.render = function( vmodel ){
        var diagramArgs = calDiagramArgs( vmodel )
        renderBg( diagramArgs )
        renderDom( vmodel, diagramArgs )
        renderSvg( vmodel, diagramArgs )
    } 

    exports.preRender = function(){
        console.log("loading events...")
    }


    return exports

})