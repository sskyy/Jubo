define(['./diagram','./param','./util'], function(Diagram,Param,util) {
    var exports = {},
        detailParam = Param.vmodel(),
        eventAddr = "http://127.0.0.1:8080/drupal/api/node/",
        myEventsAddr = "http://127.0.0.1:8080/drupal/api/my-events.json?display_id=services_1"

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

    function standardEvent( res){
        var result = {
            title : res.title,
            intro : res.body.und[0].value,
            id : res.nid,
            args :{},
            metrics : [],
            params : []
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
                    vm.metricsKeys = []
                    vm.title = null
                    vm.intro = null
                    vm.currentMetric = null
                    vm.currentParam = null
                    vm.id = null
                    vm.myEvents = []
                    vm.$skipArray = ["metrics"]
                    vm.choosing = false
                    vm.active = function(param){
                        vm.currentParam = param
                    }
                    vm.unactive = function(){
                        vm.currentParam= null
                    }
                    vm.loadEvent = function( id, refresh ){
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
                            })    
                        }
                    }
                    vm.showEvent = function(id){
                        Diagram.preRender()
                        vm.loadEvent( id )
                    }
                    vm.loadParam = function( pid, refresh ){
                        $.getJSON("/data/detailParam.json").done( function( res ){
                            detailParam.set(res)
                        })
                    }
                    vm.showParam = function( eid, pid){
                        Diagram.preRender()
                        vm.loadEvent( eid )
                        vm.loadParam( pid )
                    }
                    vm.setMetric = function(){
                        vm.currentMetric = _.keys(vm.metrics)[0]
                    }
                    vm.set = function( event ){
                        vm.currentMetric = event.args.defaultMetric
                        vm.metricsKeys = _.keys( event.metrics)
                        event.params = standardParams( event.params )
                        _.extend( vm, event )
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