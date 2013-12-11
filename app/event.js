define(['./diagram','./param','./util'], function(Diagram,Param,util) {
    var exports = {},
        detailParam = Param.vmodel(),
        eventAddr = "http://127.0.0.1:8080/drupal/api/node/",
        myEventsAddr = "http://127.0.0.1:8080/drupal/api/my-events.json?display_id=services_1",
        paramsAddr = "http://127.0.0.1:8080/drupal/api/views/param_list.json?display_id=services_1"

    function standardAllFields( params, metrics ){
        var oneDay = 24*60*60,
            standardParams = [],
            metrics = metrics || {}

        //get all metrics and set metric to right data structure
        if( _.isEmpty(metrics)){
            for( var i in params ){
                //set data structure to {name1:value1,name2:value2}
                params[i].metric = _.object( _.compact(params[i].metric.split(",").map(function(m){
                    m = m.replace(/(^\s*)|(\s*$)/g, "")
                    var metricArr = m.indexOf(":")== -1 ? false:m.split(":")
                    if( metricArr){
                        if( metrics[metricArr[0]] == undefined){
                            console.log( "DEB: setting metric", metricArr[0], metricArr)
                            metrics[metricArr[0]] = {
                                top : parseFloat(metricArr[1]),
                                bottom : parseFloat(metricArr[1])
                            }
                        }else{
                            if( metricArr[1] > metrics[metricArr[0]].top ){
                                metrics[metricArr[0]].top = metricArr[1]
                            }else if(metricArr[1] < metrics[metricArr[0]].bottom){
                                metrics[metricArr[0]].bottom = metricArr[1]
                            }
                        }
                    }
                    
                    return  metricArr
                })))
            }
        }
        console.log("DEB: get metircs",metrics)

        for( var i=0,length=params.length;i<length;i++){
            var param = _.extend(_.pick(params[i],"title","id","time","content","metric"),{
                time : Date.parse(params[i].time),
                timeText : moment(params[i].time).format('YYYY-MM-DD'),
                isActive :false,
            })
            // console.log("DEB: standard param", param)

            //calculate time from node to node
            if( i > 0 ){
                params[i].fromLast = Math.ceil((params[i].time-params[i-1].time)/oneDay).toString()+'天'
            }

            for( j in metrics ){
                if( params[i].metric[j] === undefined){
                    //fix bug for any metric only appear in one param
                    if( metrics[j].bottom== metrics[j].top){
                        metrics[j].bottom = 0
                    }
                    params[i].metric[j] = metrics[j].bottom
                }
            }
            //deal with params short of metrics
            standardParams.push(param)
        }
        console.log( "DEB: standard all fields", [standardParams,metrics])
        return [standardParams,metrics]
    }

    function standardEvent( res){
        var result = {
            title : res.title,
            intro : res.body.und[0].value,
            id : res.nid,
            args :{}
        }
        return result
    }
    
    exports.vmodel = (function(){
        var eventVm
        return function( general ){
            if( !eventVm){
                eventVm = avalon.define("event",function(vm){
                    vm.params = []
                    vm.metrics = {}
                    vm.metircsKeys = []
                    vm.title = null
                    vm.intro = null
                    vm.currentMetric = null
                    vm.currentParam = null
                    vm.id = null
                    vm.myEvents = []
                    vm.choosing = false
                    vm.metrics = {}
                    vm.active = function(param){
                        vm.currentParam = param
                    }
                    vm.unactive = function(){
                        vm.currentParam= null
                    }
                    vm.loadEvent = function( id, refresh ){
                        var defer = $.Deferred()
                        if( refresh || !vm.id || id != vm.id ){
                            vm.choosing = false
                            //demo
                            // return $.getJSON("/data/event.json",function(data){
                            //     console.log("DEB: load event complete, begin set!")
                            //     vm.set( data ) 
                            // })
                            // console.log("ajax get event data", refresh, vm.id, id!= vm.id)
                            util.api({
                                url:eventAddr+id+".json",
                            }).done( function(res){
                                res = standardEvent(res)
                                vm.set( res ) 
                                util.api({
                                    url : paramsAddr + "&event_id="+id
                                }).done(function(data){
                                    var standardFields= standardAllFields(data)
                                    var params = standardFields[0]
                                    var metrics = standardFields[1]
                                    vm.setMetrics( metrics )
                                    vm.params = params
                                    defer.resolve(vm)
                                }).fail(function(){
                                    console.log("ERR: failed to load params for event", id)
                                    vm.reject()
                                })
                            })    
                        }else{
                            defer.resolve(vm)
                        }
                        return defer
                    }
                    vm.showEvent = function(id){
                        Diagram.preRender()
                        vm.loadEvent( id )
                    }
                    vm.showParam = function( eid, pid){
                        Diagram.preRender()
                        $.when( vm.loadEvent( eid ), detailParam.load( pid ) ).done(function(){
                            console.log( vm.metrics)
                            detailParam.setEventMetrics(vm.metrics.$model)
                        })
                    }
                    vm.setMetrics = function( metrics ){
                        console.log("DEB: set metrics", vm.metrics, metrics)
                        vm.metrics = metrics
                        vm.currentMetric = vm.currentMetric || _.keys(metrics)[0]
                    }
                    vm.set = function( event ){
                        vm.currentMetric = event.args.defaultMetric || null
                        // vm.metricsKeys = event.metrics.length ? event.metrics[0]
                        //load params seperatly
                        // event.params = standardParams( event.params )
                        _.extend( vm, event )
                    }
                    vm.setCurrentMetric = function( metricName){
                        vm.currentMetric = metricName
                    }
                    vm.paramRendered = function(a){
                        if( a == "add" && eventVm.params.length!==0){
                            console.log("DEB: param dom ready, going to render diagram")
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
                })
                return eventVm
            }
        }
    })()

    return exports

})