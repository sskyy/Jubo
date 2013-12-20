define(['./diagram','./piece','./util','./global'], function(Diagram,Piece,Util,Global) {
    var exports = {},
        detailPiece = Piece.vmodel(),
        baseUrl = Global.baseUrl,
        eventAddr = baseUrl+"event/eventWithPieces/",
        // myEventsAddr = baseUrl+"me/event",
        myEventsAddr = baseUrl+"event/",
        eventDeleteAddr = baseUrl + "event/delete/"
        piecesAddr = baseUrl+"piece/piecesById"

    function standardAllFields( pieces, metrics ){
        var standardPieces = [],
            metrics = metrics || {}
            systemMetricNames = _.keys(Global.systemMetrics)
            //not use for now
            // systemMetricNames = ['阅读']
        //get all metrics and set metric to right data structure
        if( _.isEmpty(metrics)){
            for( var i in pieces ){
                _.each( pieces[i].metrics,function( metricVal, metricName){
                    if( _.indexOf( systemMetricNames, metricName)!=-1){
                        return 
                    }
                    pieces[i].metrics[metricName] = metricVal = parseFloat(metricVal)
                    if( metrics[metricName] == undefined){
                        // console.log( "DEB: setting metric", metricArr[0], metricArr)
                        metrics[metricName] = {
                            top : metricVal,
                            bottom : metricVal
                        }
                    }else{
                        if( metricVal > metrics[metricName].top ){
                            metrics[metricName].top = metricVal
                        }else if(metricVal < metrics[metricName].bottom){
                            metrics[metricName].bottom = metricVal
                        }
                    }
                })

                //standard each system metrics
                _.each(Global.systemMetrics,function(field,name){
                    pieces[i].metrics[name] = parseFloat( eval("pieces[i]."+field))

                    if( !metrics[name] ){
                        metrics[name] = {
                            top:pieces[i].metrics[name],
                            bottom:pieces[i].metrics[name]
                        }
                    }else{
                        if( pieces[i].metrics[name] > metrics[name].top ){
                            metrics[name].top = pieces[i].metrics[name]
                        }else if( pieces[i].metrics[name] < metrics[name].bottom){
                            metrics[name].bottom = pieces[i].metrics[name]
                        }
                    }
                })

            }
        }

        _.each(metrics,function(boundary,name){
            console.log( "checking",name, boundary)
            if( boundary.top == boundary.bottom &&boundary.bottom == 0 ){
                console.log("delete top bottom both 0 metric,",name,boundary)
                delete metrics[name]
            }else{
                if( metrics[name].bottom == metrics[name].top && metrics[name].top > 0){
                    metrics[name].bottom = 0
                }
            }
        })
        console.log("DEB: get metrics",metrics)

        for( var i=0,length=pieces.length;i<length;i++){
            var piece = _.extend(_.pick(pieces[i],"title","id","content","metrics","cover"),{
                time : Date.parse(pieces[i].createdAt),
                timeText : moment(pieces[i].time).format('YYYY-MM-DD'),
                isActive :false,
            })
            //store last timestamp
            pieces[i].time = Date.parse(pieces[i].createdAt)

            //calculate time from node to node
            if( i > 0 ){
                piece.fromLast = moment.duration(pieces[i].time-pieces[i-1].time).humanize()
            }

            //fix bug for any metric not appeared in every piece
            _.each( metrics,function( boundary,name ){
                if( piece.metrics[name] === undefined ){
                    piece.metrics[name] = metrics[name].bottom
                }
            })

            standardPieces.push(piece)
            
            //deal with system metrics            
        }
        console.log( "DEB: standard all fields", [standardPieces,metrics])
        return [metrics,standardPieces]
    }
    
    exports.vmodel = (function(){
        var eventVm
        return function( general ){
            if( !eventVm){
                eventVm = avalon.define("event",function(vm){
                    vm.pieces = []
                    vm.metrics = {}
                    vm.metircsKeys = []
                    vm.title = null
                    vm.content = null
                    vm.currentMetric = null
                    vm.currentPiece = null
                    vm.id = null
                    vm.uid = null
                    vm.myEvents = []
                    vm.choosing = false
                    vm.loading = false
                    vm.isAuthor = false
                    vm.active = function(piece){
                        vm.currentPiece = piece
                    }
                    vm.unactive = function(){
                        vm.currentPiece= null
                    }
                    vm.loadEvent = function( id, refresh ){
                        var defer = $.Deferred()
                        if( refresh || !vm.id || id != vm.id ){
                            vm.loading = true
                            vm.choosing = false
                            console.log( "DEB: ", refresh? "refresh event" : "load new event" , id)
                            Util.api({
                                url:eventAddr + id,
                            }).done( function( event){
                                console.log('DEB: get event',event)
                                vm.set( event ) 
                                //call render clear the diagram, cause pieces dom will not render
                                if( event.pieces.length == 0 ){
                                    Diagram.render( eventVm, general )
                                }
                                vm.isAuthor = (general.user.id == eventVm.uid)
                                vm.loading = false
                                defer.resolve()
                            }).fail(function(){
                                vm.loading = false
                                console.log("ERR: failed to load event", id)
                                defer.reject()
                            })    
                        }else{
                            defer.resolve(vm)
                        }
                        return defer
                    }
                    vm.showEvent = function(id, refresh){
                        Diagram.preRender()
                        vm.loadEvent( id, refresh )
                    }
                    vm.showPiece = function( eid, pid){
                        Diagram.preRender()
                        $.when( vm.loadEvent( eid ), detailPiece.load( pid ) ).done(function(){
                            console.log("DEB: ready to show piece")
                            detailPiece.setEventMetrics(vm.metrics.$model)
                        })
                    }
                    vm.setMetrics = function( metrics ){
                        console.log("DEB: set metrics", vm.metrics, metrics)
                        vm.metrics = metrics
                        vm.currentMetric = vm.currentMetric || _.keys(metrics)[0]
                    }
                    vm.set = function( event ){
                        var standardFiels = standardAllFields( event.pieces ),
                            metricKeys = _.keys( standardFiels[0] )

                        vm.metrics = standardFiels[0]
                        //for avalon's issue
                        vm.metricKeys = metricKeys
                        vm.pieces = standardFiels[1]
                        vm.currentMetric = event.args.defaultMetric || metricKeys[0]
                        _.extend( vm, _.pick(event,'id','title','content','uid') )
                    }
                    vm.setCurrentMetric = function( metricName){
                        vm.currentMetric = metricName
                    }
                    vm.pieceRendered = function(a){
                        if( a == "add" && eventVm.pieces.length!==0){
                            console.log("DEB: piece dom ready, going to render diagram")
                            Diagram.render( eventVm, general )
                        }
                    }
                    vm.getEventId = function(){
                        return vm.id
                    }
                    vm.switchMode = function( mode ){
                        vm.choosing = mode || false
                    }
                    vm.loadMyEvents = function(){
                        vm.choosing = true
                        Util.api({
                            url : myEventsAddr,
                        }).done(function(data){
                            vm.myEvents = data
                        }).fail(function(){
                            console.log("ERR: load my events failed")
                        })
                    }
                    vm.getPieceId = function(){
                        return detailPiece.id;
                    }
                    vm.deleteEvent = function(){
                        if( confirm("确定删除事件？所有的片段也会被删除。")){
                            Util.api({
                                url : eventDeleteAddr + vm.id,
                                type : "delete",
                            }).done(function(){
                                page("/")
                            })
                        }
                    }
                })
                //add in
                general.user.$watch("id",function(id){
                    if( id != 0 ){
                        eventVm.isAuthor = (id == eventVm.uid)
                    }
                })
                return eventVm
            }

        }
    })()

    return exports

})