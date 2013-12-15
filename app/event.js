define(['./diagram','./piece','./util'], function(Diagram,Piece,util) {
    var exports = {},
        detailPiece = Piece.vmodel(),
        baseUrl = "http://127.0.0.1:1337/",
        eventAddr = baseUrl+"event/eventWithPieces/",
        // myEventsAddr = baseUrl+"me/event",
        myEventsAddr = baseUrl+"event/",
        piecesAddr = baseUrl+"piece/piecesById"

    function standardAllFields( pieces, metrics ){
        var standardPieces = [],
            metrics = metrics || {}
            //not use for now
            // systemMetricNames = ['阅读']
        //get all metrics and set metric to right data structure
        if( _.isEmpty(metrics)){
            for( var i in pieces ){
                _.each( pieces[i].metrics,function( metricVal, metricName){
                    metricVal = parseFloat(metricVal)
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
                
            }
        }
        console.log("DEB: get metircs",metrics)

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

            for( j in metrics ){
                if( pieces[i].metrics[j] === undefined){
                    //fix bug for any metric only appear in one piece
                    if( metrics[j].bottom== metrics[j].top){
                        metrics[j].bottom = 0
                    }
                    pieces[i].metrics[j] = metrics[j].bottom
                }else{
                    pieces[i].metrics[j] = parseFloat(pieces[i].metrics[j])
                }
            }
            //deal with pieces short of metrics
            standardPieces.push(piece)
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
                    vm.myEvents = []
                    vm.choosing = false
                    vm.loading = false
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
                            util.api({
                                url:eventAddr + id,
                            }).done( function( event){
                                console.log('DEB: get event',event)
                                vm.set( event ) 
                                //call render clear the diagram, cause pieces dom will not render
                                if( event.pieces.length == 0 ){
                                    Diagram.render( eventVm, general )
                                }
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
                        util.api({
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
                })
                return eventVm
            }
        }
    })()

    return exports

})